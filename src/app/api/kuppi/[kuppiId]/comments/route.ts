import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

const MAX_COMMENT_LENGTH = 1000;

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

    const commentIdStrings = comments.map((comment) => String(comment._id));
    const likedSet = new Set<string>();
    if (user && commentIdStrings.length > 0) {
      const votes = await db
        .collection("comment_votes")
        .find({ userId: user.uid, commentId: { $in: commentIdStrings }, value: 1 })
        .toArray();
      votes.forEach((vote) => likedSet.add(vote.commentId));
    }

    const safeComments = comments.map((comment) => ({
      _id: comment._id,
      userName: comment.userName,
      userPhoto: comment.userPhoto || null,
      body: comment.body,
      parentId: comment.parentId ?? null,
      score: comment.score ?? 0,
      createdAt: comment.createdAt,
      canDelete: user ? comment.userId === user.uid : false,
      likedByMe: user ? likedSet.has(String(comment._id)) : false,
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
    const requestPhoto =
      typeof body?.userPhoto === "string" ? body.userPhoto.trim() : "";
    const parentId =
      typeof body?.parentId === "string" && body.parentId.trim()
        ? body.parentId.trim()
        : null;

    if (!text) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userPhoto =
      user.photoURL ||
      (requestPhoto.startsWith("http") ? requestPhoto : "") ||
      null;
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
      userPhoto,
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
        likedByMe: false,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
