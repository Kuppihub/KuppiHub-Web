import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // ============ AUTHENTICATION CHECK ============
    const authHeader = request.headers.get("authorization");
    const verifiedUser = await authenticateRequest(authHeader);

    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fcm_token } = body;

    // Validate FCM token
    if (!fcm_token || typeof fcm_token !== "string" || fcm_token.trim() === "") {
      return NextResponse.json(
        { error: "Valid fcm_token is required" },
        { status: 400 }
      );
    }

    const trimmedToken = fcm_token.trim();

    // Get current user's ID
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

    // Check if device exists AND belongs to current user
    const { data: existingDevice } = await supabaseAdmin
      .from("user_devices")
      .select("id, user_id")
      .eq("fcm_token", trimmedToken)
      .single();

    if (!existingDevice) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 }
      );
    }

    // Only allow users to logout their own devices
    if (existingDevice.user_id && existingDevice.user_id !== userData.id) {
      return NextResponse.json(
        { error: "Cannot logout another user's device" },
        { status: 403 }
      );
    }

    // Set user_id to NULL (convert to guest)
    const { error } = await supabaseAdmin
      .from("user_devices")
      .update({ user_id: null })
      .eq("fcm_token", trimmedToken);

    if (error) {
      console.error("Error logging out device:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Device logged out successfully. Device is now a guest.",
    });
  } catch (error) {
    console.error("Error in logout API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
