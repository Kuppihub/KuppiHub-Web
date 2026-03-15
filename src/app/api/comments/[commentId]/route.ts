import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authenticateRequest } from "@/lib/firebase-admin";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "kuppihub");
};

export async function DELETE(
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

    const db = await getDb();
    const commentId = new ObjectId(commentIdParam);
    const comment = await db.collection("comments").findOne({ _id: commentId });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== user.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.collection("comments").updateOne(
      { _id: commentId },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
