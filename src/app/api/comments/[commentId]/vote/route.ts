import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

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

    const rate = await rateLimit(`comment:vote:${user.uid}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many votes. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rate.retryAfterMs ?? 0) / 1000)),
          },
        }
      );
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
    let liked = true;
    if (existing) {
      if (existing.value === value) {
        await db.collection("comment_votes").deleteOne({ _id: existing._id });
        const updated = await db.collection("comments").findOneAndUpdate(
          { _id: commentId },
          { $inc: { score: -existing.value } },
          { returnDocument: "after" }
        );
        const newScore =
          (updated as { value?: { score?: number } })?.value?.score ??
          (updated as { score?: number })?.score ??
          0;
        return NextResponse.json({
          score: newScore,
          liked: false,
        });
      }
      delta = value - existing.value;
      await db.collection("comment_votes").updateOne(
        { _id: existing._id },
        { $set: { value, updatedAt: new Date() } }
      );
      liked = value === 1;
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
    const newScore =
      (updated as { value?: { score?: number } })?.value?.score ??
      (updated as { score?: number })?.score ??
      0;

    return NextResponse.json({ score: newScore, liked });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
