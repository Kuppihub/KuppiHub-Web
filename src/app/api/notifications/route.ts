import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
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

    // ============ PAGINATION ============
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // ============ FETCH NOTIFICATIONS ============
    const { data: notifications, error: notifError, count } = await supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (notifError) {
      console.error("Error fetching notifications:", notifError);
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in get notifications API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
