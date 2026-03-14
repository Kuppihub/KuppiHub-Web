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
    const reviews = await db
      .collection("reviews")
      .find({ kuppiId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
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
    const rating = Number(body?.rating);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const text = typeof body?.body === "string" ? body.body.trim() : "";

    if (!rating || rating < 1 || rating > 5 || !text) {
      return NextResponse.json(
        { error: "Rating (1-5) and review are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.collection("reviews").findOne({
      kuppiId,
      userId: user.uid,
      isDeleted: { $ne: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already submitted a review for this Kuppi" },
        { status: 409 }
      );
    }

    const doc = {
      kuppiId,
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      rating,
      title,
      body: text,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };

    const result = await db.collection("reviews").insertOne(doc);

    return NextResponse.json({ review: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
