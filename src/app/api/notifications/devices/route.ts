import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 1. CHANGED: Accept 'firebase_uid' (String) instead of 'user_id' (Number)
    const { fcm_token, firebase_uid, device_type = "android", app_version } = body;

    if (!fcm_token || typeof fcm_token !== "string" || fcm_token.trim() === "") {
      return NextResponse.json({ error: "Valid fcm_token is required" }, { status: 400 });
    }

    const trimmedToken = fcm_token.trim();
    let internalSqlId: number | null = null;

    // 2. If a user is claiming this device
    if (firebase_uid) {
      // A. Verify Auth Header
      const authHeader = request.headers.get("authorization");
      const verifiedUser = await authenticateRequest(authHeader);

      if (!verifiedUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // B. Security Check: Ensure the token belongs to the user claiming the device
      if (verifiedUser.uid !== firebase_uid) {
        return NextResponse.json({ error: "Forbidden: UID Mismatch" }, { status: 403 });
      }

      // C. Look up the SQL ID from the 'users' table using the Firebase UID
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("firebase_uid", firebase_uid)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ error: "User not found in database" }, { status: 404 });
      }

      internalSqlId = userData.id; // This is the Number (e.g., 55)
    }

    // 3. Use 'internalSqlId' for the database operations
    const { data: existingDevice } = await supabaseAdmin
      .from("user_devices")
      .select("id")
      .eq("fcm_token", trimmedToken)
      .single();

    let result;
    if (existingDevice) {
      const { data, error } = await supabaseAdmin
        .from("user_devices")
        .update({
          user_id: internalSqlId, // Use the looked-up integer
          device_type: device_type,
          app_version: app_version || null,
          last_active: new Date().toISOString(),
        })
        .eq("fcm_token", trimmedToken)
        .select()
        .single();
        
       if (error) throw error; 
       result = { success: true, action: "updated", data };
    } else {
      const { data, error } = await supabaseAdmin
        .from("user_devices")
        .insert({
          user_id: internalSqlId, // Use the looked-up integer
          fcm_token: trimmedToken,
          device_type: device_type,
          app_version: app_version || null,
          last_active: new Date().toISOString(),
        })
        .select()
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
