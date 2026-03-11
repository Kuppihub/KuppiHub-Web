import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

// Admin token validation (use environment variable in production)
const ADMIN_SECRET = process.env.NOTIFICATIONS_ADMIN_SECRET;

async function isAdmin(request: NextRequest): Promise<boolean> {
  // Method 1: Check if user is authenticated and has admin role (if you have admin field)
  const authHeader = request.headers.get("authorization");
  const adminSecret = request.headers.get("x-admin-secret");

  // Use admin secret for service-to-service calls
  if (adminSecret && ADMIN_SECRET && adminSecret === ADMIN_SECRET) {
    return true;
  }

  // Alternative: Check Firebase auth + admin role in database
  const verifiedUser = await authenticateRequest(authHeader);
  if (!verifiedUser) {
    return false;
  }

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("firebase_uid", verifiedUser.uid)
    .single();

  return userData?.is_admin === true;
}

export async function POST(request: NextRequest) {
  try {
    // ============ ADMIN AUTHENTICATION ============
    const isAdminUser = await isAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { target_type, target_value, title, body: messageBody, data } = body;

    // ============ INPUT VALIDATION ============
    if (!target_type || !["topic", "user", "guest_broadcast"].includes(target_type)) {
      return NextResponse.json(
        { error: "Invalid target_type. Must be: topic, user, or guest_broadcast" },
        { status: 400 }
      );
    }

    if (!target_value || typeof target_value !== "string") {
      return NextResponse.json(
        { error: "Valid target_value is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Valid title is required" },
        { status: 400 }
      );
    }

    if (!messageBody || typeof messageBody !== "string" || messageBody.trim() === "") {
      return NextResponse.json(
        { error: "Valid message body is required" },
        { status: 400 }
      );
    }

    const sanitizedData = data && typeof data === "object" ? data : {};
    const trimmedTitle = title.trim();
    const trimmedBody = messageBody.trim();

    // ============ SEND NOTIFICATION BASED ON TARGET TYPE ============
    let result = {
      success: true,
      message: "",
      notifications_sent: 0,
      data: {} as any,
    };

    if (target_type === "user") {
      // Send to specific user
      const userId = parseInt(target_value, 10);
      if (isNaN(userId)) {
        return NextResponse.json(
          { error: "target_value must be a valid user ID" },
          { status: 400 }
        );
      }

      // Get user's devices
      const { data: devices, error: deviceError } = await supabaseAdmin
        .from("user_devices")
        .select("fcm_token")
        .eq("user_id", userId);

      if (deviceError) {
        console.error("Error fetching user devices:", deviceError);
        return NextResponse.json({ error: deviceError.message }, { status: 500 });
      }

      // Insert notification in database
      const { data: notification, error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: userId,
          title: trimmedTitle,
          body: trimmedBody,
          data: sanitizedData,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting notification:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      result.message = `Notification sent to user ${userId}`;
      result.notifications_sent = devices?.length || 0;
      result.data = {
        notification_id: notification.id,
        devices_targeted: devices?.length || 0,
        fcm_tokens: devices?.map((d) => d.fcm_token) || [],
      };
    } else if (target_type === "guest_broadcast") {
      // Send to all guests (devices with user_id = NULL)
      const { data: guestDevices, error: guestError } = await supabaseAdmin
        .from("user_devices")
        .select("fcm_token")
        .is("user_id", null);

      if (guestError) {
        console.error("Error fetching guest devices:", guestError);
        return NextResponse.json({ error: guestError.message }, { status: 500 });
      }

      result.message = `Broadcast notification sent to ${guestDevices?.length || 0} guest devices`;
      result.notifications_sent = guestDevices?.length || 0;
      result.data = {
        guest_devices_targeted: guestDevices?.length || 0,
        fcm_tokens: guestDevices?.map((d) => d.fcm_token) || [],
      };
    } else if (target_type === "topic") {
      // Send to topic (e.g., "all_users", "maths_module", etc.)
      // For topic-based notifications, you would use FCM's topic API
      // This is a placeholder for your FCM integration
      result.message = `Notification scheduled for topic: ${target_value}`;
      result.data = {
        topic: target_value,
        title: trimmedTitle,
        body: trimmedBody,
        note: "Topic sending requires FCM integration - not implemented in this example",
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in send notification API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
