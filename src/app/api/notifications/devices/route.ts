import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fcm_token, firebase_uid, device_type = "android", app_version } = body;

    if (!fcm_token || typeof fcm_token !== "string" || fcm_token.trim() === "") {
      return NextResponse.json({ error: "Valid fcm_token is required" }, { status: 400 });
    }

    const trimmedToken = fcm_token.trim();
    let internalSqlId: number | null = null;

    if (firebase_uid) {
      const authHeader = request.headers.get("authorization");
      const verifiedUser = await authenticateRequest(authHeader);

      if (!verifiedUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (verifiedUser.uid !== firebase_uid) {
        return NextResponse.json({ error: "Forbidden: UID Mismatch" }, { status: 403 });
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("firebase_uid", firebase_uid)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ error: "User not found in database" }, { status: 404 });
      }

      internalSqlId = userData.id;
    }

    const { data: existingDevice } = await supabaseAdmin
      .from("user_devices")
      .select("id, user_id")
      .eq("fcm_token", trimmedToken)
      .single();

    // Guests must not unlink or overwrite an already-bound user device
    if (!firebase_uid && existingDevice?.user_id) {
      return NextResponse.json(
        { error: "Unauthorized: device already registered to a user" },
        { status: 401 }
      );
    }

    let result;
    if (existingDevice) {
      const { data, error } = await supabaseAdmin
        .from("user_devices")
        .update({
          user_id: internalSqlId,
          device_type: device_type,
          app_version: app_version || null,
          last_active: new Date().toISOString(),
        })
        .eq("fcm_token", trimmedToken)
        .select("id,user_id,device_type,app_version,last_active")
        .single();

      if (error) throw error;
      result = { success: true, action: "updated", data };
    } else {
      const { data, error } = await supabaseAdmin
        .from("user_devices")
        .insert({
          user_id: internalSqlId,
          fcm_token: trimmedToken,
          device_type: device_type,
          app_version: app_version || null,
          last_active: new Date().toISOString(),
        })
        .select("id,user_id,device_type,app_version,last_active")
        .single();

      if (error) throw error;
      result = { success: true, action: "created", data };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
