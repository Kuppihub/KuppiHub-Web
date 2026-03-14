import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/firebase-admin";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "kuppihub");
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId: commentIdParam } = await params;
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ObjectId.isValid(commentIdParam)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const body = await req.json();
    const value = Number(body?.value);
    if (![1, -1].includes(value)) {
      return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
    }

    const db = await getDb();
    const commentId = new ObjectId(commentIdParam);

    const existing = await db.collection("comment_votes").findOne({
      commentId: commentIdParam,
      userId: user.uid,
    });

    let delta = value;
    if (existing) {
      if (existing.value === value) {
        const comment = await db.collection("comments").findOne({ _id: commentId });
        return NextResponse.json({ score: comment?.score ?? 0 });
      }
      delta = value - existing.value;
      await db.collection("comment_votes").updateOne(
        { _id: existing._id },
        { $set: { value, updatedAt: new Date() } }
      );
    } else {
      await db.collection("comment_votes").insertOne({
        commentId: commentIdParam,
        userId: user.uid,
        value,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const updated = await db.collection("comments").findOneAndUpdate(
      { _id: commentId },
      { $inc: { score: delta } },
      { returnDocument: "after" }
    );

    return NextResponse.json({ score: updated?.value?.score ?? 0 });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
