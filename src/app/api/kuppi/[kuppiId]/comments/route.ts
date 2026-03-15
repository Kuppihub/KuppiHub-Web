import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/firebase-admin";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "kuppihub");
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kuppiId: string }> }
) {
  try {
    const { kuppiId } = await params;
    const db = await getDb();
    const comments = await db
      .collection("comments")
      .find({ kuppiId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ comments });
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

    return NextResponse.json({ comment: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
