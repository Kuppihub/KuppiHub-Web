import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "kuppihub");
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kuppiId: string }> }
) {
  try {
    const user = await authenticateRequest(_req.headers.get("authorization"));
    const { kuppiId } = await params;
    const db = await getDb();
    const comments = await db
      .collection("comments")
      .find({ kuppiId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    const safeComments = comments.map((comment) => ({
      _id: comment._id,
      userName: comment.userName,
      userPhoto: comment.userPhoto || null,
      body: comment.body,
      parentId: comment.parentId ?? null,
      score: comment.score ?? 0,
      createdAt: comment.createdAt,
      canDelete: user ? comment.userId === user.uid : false,
    }));

    return NextResponse.json({ comments: safeComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kuppiId: string }> }
) {
  try {
    const { kuppiId } = await params;
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = await rateLimit(`comment:create:${user.uid}:${kuppiId}`, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many comments. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rate.retryAfterMs ?? 0) / 1000)),
          },
        }
      );
    }

    const body = await req.json();
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    const parentId =
      typeof body?.parentId === "string" && body.parentId.trim()
        ? body.parentId.trim()
        : null;

    if (!text) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    const db = await getDb();
    if (parentId) {
      if (!ObjectId.isValid(parentId)) {
        return NextResponse.json({ error: "Invalid parent comment ID" }, { status: 400 });
      }
      const parent = await db.collection("comments").findOne({
        _id: new ObjectId(parentId),
        kuppiId,
        isDeleted: { $ne: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }
    const doc = {
      kuppiId,
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      userPhoto: user.photoURL || null,
      body: text,
      parentId,
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };

    const result = await db.collection("comments").insertOne(doc);

    return NextResponse.json({
      comment: {
        _id: result.insertedId,
        userName: doc.userName,
        userPhoto: doc.userPhoto,
        body: doc.body,
        parentId: doc.parentId ?? null,
        score: doc.score,
        createdAt: doc.createdAt,
        canDelete: true,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
