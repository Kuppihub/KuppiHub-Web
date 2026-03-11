import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export async function PUT(request: NextRequest) {
  try {
    // ============ SERVER-SIDE AUTHENTICATION ============
    const authHeader = request.headers.get("authorization");
    const verifiedUser = await authenticateRequest(authHeader);

    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get user ID from Firebase UID
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("firebase_uid", verifiedUser.uid)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // ============ EXTRACT NOTIFICATION ID FROM URL ============
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const notificationId = parseInt(pathParts[4], 10);

    if (!notificationId || isNaN(notificationId)) {
      return NextResponse.json(
        { error: "Valid notification ID is required" },
        { status: 400 }
      );
    }

    // ============ VERIFY OWNERSHIP & UPDATE ============
    // First, verify that this notification belongs to the user
    const { data: notification } = await supabaseAdmin
      .from("notifications")
      .select("id")
      .eq("id", notificationId)
      .eq("user_id", userId)
      .single();

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found or access denied" },
        { status: 404 }
      );
    }

    // Mark as read
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      console.error("Error marking notification as read:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data,
    });
  } catch (error) {
    console.error("Error in mark as read API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
