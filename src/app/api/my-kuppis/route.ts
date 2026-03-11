import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { authenticateRequest } from "@/lib/firebase-admin";
import {
  validateTitle,
  validateDescription,
  validateLanguageCode,
  validateUrlArray,
  isValidYoutubeUrl,
  isValidTelegramUrl,
  isValidGdriveUrl,
  isValidOnedriveUrl,
} from "@/lib/validation";

// GET - Fetch all kuppis added by the logged-in user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication via Bearer token
    const authHeader = request.headers.get("authorization");
    const verifiedUser = await authenticateRequest(authHeader);

    if (!verifiedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from verified Firebase UID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", verifiedUser.uid)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all videos added by this user
    const { data, error } = await supabase
      .from("videos")
      .select(`
        id,
        title,
        description,
        youtube_links,
        telegram_links,
        gdrive_cloud_video_urls,
        onedrive_cloud_video_urls,
        material_urls,
        is_kuppi,
        is_hidden,
        is_approved,
        language_code,
        created_at,
        published_at,
        module:module_id (
          id,
          code,
          name
        ),
        student:student_id (
          id,
          name
        )
      `)
      .eq("added_by_user_id", userData.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching my kuppis:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error in GET /api/my-kuppis:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a kuppi (title, description, links, or hide/unhide)
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication via Bearer token
    const authHeader = request.headers.get("authorization");
    const verifiedUser = await authenticateRequest(authHeader);

    if (!verifiedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      video_id,
      title,
      description,
      language_code,
      is_hidden,
      youtube_links,
      telegram_links,
      gdrive_cloud_video_urls,
      onedrive_cloud_video_urls,
      material_urls,
    } = body;

    if (!video_id || typeof video_id !== "number") {
      return NextResponse.json({ error: "Valid Video ID is required" }, { status: 400 });
    }

    // Get user ID from verified Firebase UID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", verifiedUser.uid)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the user owns this video
    const { data: videoData } = await supabase
      .from("videos")
      .select("id, added_by_user_id")
      .eq("id", video_id)
      .single();

    if (!videoData) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (videoData.added_by_user_id !== userData.id) {
      return NextResponse.json({ error: "You can only edit your own kuppis" }, { status: 403 });
    }

    // Build update object with validated and sanitized fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    // Validate title if provided
    if (title !== undefined) {
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        return NextResponse.json({ error: titleValidation.error }, { status: 400 });
      }
      updateData.title = titleValidation.sanitized;
    }

    // Validate description if provided
    if (description !== undefined) {
      const descValidation = validateDescription(description);
      if (!descValidation.valid) {
        return NextResponse.json({ error: descValidation.error }, { status: 400 });
      }
      updateData.description = descValidation.sanitized;
    }

    // Validate language code if provided
    if (language_code !== undefined) {
      if (!validateLanguageCode(language_code)) {
        return NextResponse.json({ error: "Invalid language code" }, { status: 400 });
      }
      updateData.language_code = language_code;
    }

    // Validate is_hidden if provided
    if (is_hidden !== undefined) {
      if (typeof is_hidden !== "boolean") {
        return NextResponse.json({ error: "Invalid is_hidden value" }, { status: 400 });
      }
      updateData.is_hidden = is_hidden;
    }

    // Validate and sanitize URLs if provided
    if (youtube_links !== undefined) {
      updateData.youtube_links = validateUrlArray(youtube_links, isValidYoutubeUrl);
    }
    if (telegram_links !== undefined) {
      updateData.telegram_links = validateUrlArray(telegram_links, isValidTelegramUrl);
    }
    if (gdrive_cloud_video_urls !== undefined) {
      updateData.gdrive_cloud_video_urls = validateUrlArray(gdrive_cloud_video_urls, isValidGdriveUrl);
    }
    if (onedrive_cloud_video_urls !== undefined) {
      updateData.onedrive_cloud_video_urls = validateUrlArray(onedrive_cloud_video_urls, isValidOnedriveUrl);
    }
    if (material_urls !== undefined) {
      updateData.material_urls = validateUrlArray(material_urls);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Update the video
    const { data, error } = await supabase
      .from("videos")
      .update(updateData)
      .eq("id", video_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating video:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: is_hidden !== undefined 
        ? (is_hidden ? "Kuppi hidden successfully" : "Kuppi unhidden successfully")
        : "Kuppi updated successfully",
      data,
    });
  } catch (err) {
    console.error("Error in PUT /api/my-kuppis:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Toggle hide/unhide a kuppi (quick action)
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication via Bearer token
    const authHeader = request.headers.get("authorization");
    const verifiedUser = await authenticateRequest(authHeader);

    if (!verifiedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { video_id } = body;

    if (!video_id || typeof video_id !== "number") {
      return NextResponse.json({ error: "Valid Video ID is required" }, { status: 400 });
    }

    // Get user ID from verified Firebase UID
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", verifiedUser.uid)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current video state and verify ownership
    const { data: videoData } = await supabase
      .from("videos")
      .select("id, added_by_user_id, is_hidden")
      .eq("id", video_id)
      .single();

    if (!videoData) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (videoData.added_by_user_id !== userData.id) {
      return NextResponse.json({ error: "You can only edit your own kuppis" }, { status: 403 });
    }

    // Toggle is_hidden
    const newHiddenState = !videoData.is_hidden;

    const { data, error } = await supabase
      .from("videos")
      .update({ is_hidden: newHiddenState })
      .eq("id", video_id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling video visibility:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: newHiddenState ? "Kuppi hidden successfully" : "Kuppi is now visible",
      data,
    });
  } catch (err) {
    console.error("Error in PATCH /api/my-kuppis:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
