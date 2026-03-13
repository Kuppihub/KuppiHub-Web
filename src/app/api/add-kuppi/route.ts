import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";
import {
  validateTitle,
  validateDescription,
  validateLanguageCode,
  validateIndexNo,
  validateUrlArray,
  isValidYoutubeUrl,
  isValidTelegramUrl,
  isValidGdriveUrl,
  isValidOnedriveUrl,
  validateUrl,
} from "@/lib/validation";

// Allowed domain options (must match frontend DOMAIN_OPTIONS)
const ALLOWED_DOMAIN_OPTIONS = [
  '@uom.lk',
  '@cse.mrt.ac.lk',
  '@gmail.com',
] as const;

// Helper function to get user ID from firebase_uid
async function getUserIdFromFirebaseUid(firebaseUid: string): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("firebase_uid", firebaseUid)
    .single();
  return data?.id || null;
}

// Helper function to find or create student by index_no
async function findOrCreateStudent(indexNo: string): Promise<number | null> {
  const trimmedIndexNo = indexNo.trim().toUpperCase();
  
  // First, try to find existing student
  const { data: existingStudent } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("index_no", trimmedIndexNo)
    .single();

  if (existingStudent) {
    return existingStudent.id;
  }

  // Student doesn't exist, create a new one with "Unknown" name
  const { data: newStudent, error } = await supabaseAdmin
    .from("students")
    .insert({
      name: "Unknown",
      index_no: trimmedIndexNo,
      // Other fields like faculty_id, department_id, batch_id, semester_id 
      // will be null - can be updated later
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating student:", error);
    return null;
  }

  return newStudent?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    // ============ SERVER-SIDE AUTHENTICATION ============
    // Verify the Firebase ID token from Authorization header
    const authHeader = request.headers.get("authorization");
    const verifiedUser = await authenticateRequest(authHeader);

    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in and try again." },
        { status: 401 }
      );
    }

    // Ensure email is verified
    if (!verifiedUser.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before adding a kuppi." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      module_id,
      title,
      description,
      language_code,
      index_no,
      is_kuppi,
      youtube_links,
      telegram_links,
      gdrive_cloud_video_urls,
      onedrive_cloud_video_urls,
      material_urls,
      allowed_domains,
    } = body;

    // ============ INPUT VALIDATION ============
    // Validate module_id
    if (!module_id || typeof module_id !== "number") {
      return NextResponse.json({ error: "Valid module is required" }, { status: 400 });
    }

    // Validate and sanitize title
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    // Validate and sanitize description
    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      return NextResponse.json({ error: descValidation.error }, { status: 400 });
    }

    // Validate language code
    if (!validateLanguageCode(language_code)) {
      return NextResponse.json({ error: "Invalid language code" }, { status: 400 });
    }

    // Validate and sanitize URLs
    const validYoutubeLinks = validateUrlArray(youtube_links, isValidYoutubeUrl);
    const validTelegramLinks = validateUrlArray(telegram_links, isValidTelegramUrl);
    const validGdriveLinks = validateUrlArray(gdrive_cloud_video_urls, isValidGdriveUrl);
    const validOnedriveLinks = validateUrlArray(onedrive_cloud_video_urls, isValidOnedriveUrl);
    const validMaterialLinks = validateUrlArray(material_urls);

    // Must have at least one valid link
    const hasValidLinks =
      validYoutubeLinks.length > 0 ||
      validTelegramLinks.length > 0 ||
      validGdriveLinks.length > 0 ||
      validOnedriveLinks.length > 0 ||
      validMaterialLinks.length > 0;

    if (!hasValidLinks) {
      return NextResponse.json(
        { error: "At least one valid video or material link is required" },
        { status: 400 }
      );
    }

    // Get user ID from verified Firebase UID
    const added_by_user_id = await getUserIdFromFirebaseUid(verifiedUser.uid);
    if (!added_by_user_id) {
      return NextResponse.json(
        { error: "User not found. Please log in again." },
        { status: 401 }
      );
    }

    // Validate index number if provided
    let validatedIndexNo: string | null = null;
    if (index_no && typeof index_no === "string" && index_no.trim()) {
      validatedIndexNo = validateIndexNo(index_no);
    }

    // Find or create student by validated index_no if provided
    let student_id = null;
    if (validatedIndexNo) {
      student_id = await findOrCreateStudent(validatedIndexNo);
    }

    // Validate allowed_domains if provided
    let validatedAllowedDomains: string[] | null = null;
    if (allowed_domains && Array.isArray(allowed_domains) && allowed_domains.length > 0) {
      // Only allow domains from the predefined list
      validatedAllowedDomains = allowed_domains.filter(
        (domain: string) => 
          typeof domain === 'string' && 
          ALLOWED_DOMAIN_OPTIONS.includes(domain as typeof ALLOWED_DOMAIN_OPTIONS[number])
      );
      // If all domains were invalid, set to null (public)
      if (validatedAllowedDomains.length === 0) {
        validatedAllowedDomains = null;
      }
    }

    // Insert video with sanitized data
    const { data, error } = await supabaseAdmin
      .from("videos")
      .insert({
        module_id,
        title: titleValidation.sanitized,
        description: descValidation.sanitized,
        language_code,
        is_kuppi: is_kuppi ?? true,
        student_id,
        added_by_user_id,
        youtube_links: validYoutubeLinks.length > 0 ? validYoutubeLinks : [],
        telegram_links: validTelegramLinks.length > 0 ? validTelegramLinks : null,
        gdrive_cloud_video_urls: validGdriveLinks.length > 0 ? validGdriveLinks : null,
        onedrive_cloud_video_urls: validOnedriveLinks.length > 0 ? validOnedriveLinks : null,
        material_urls: validMaterialLinks.length > 0 ? validMaterialLinks : null,
        allowed_domains: validatedAllowedDomains,
        published_at: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting video:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Kuppi submitted successfully",
      data,
    });
  } catch (error) {
    console.error("Error in add-kuppi API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
