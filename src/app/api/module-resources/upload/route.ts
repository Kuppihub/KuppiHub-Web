import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

const ALLOWED_DOMAIN_OPTIONS = ["@uom.lk", "@cse.mrt.ac.lk", "@gmail.com"] as const;

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const moduleId = Number(body?.module_id);
    const categoryId = Number(body?.category_id);
    const folderId = body?.folder_id === null || body?.folder_id === undefined ? null : Number(body.folder_id);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : null;
    const fileUrl = typeof body?.file_url === "string" ? body.file_url.trim() : "";
    const fileType = typeof body?.file_type === "string" ? body.file_type.trim() : null;
    const fileSizeBytes = typeof body?.file_size_bytes === "number" ? body.file_size_bytes : null;
    const storageProvider = typeof body?.storage_provider === "string" ? body.storage_provider.trim() : "discord";
    const storageKey = typeof body?.storage_key === "string" ? body.storage_key.trim() : null;
    const isPublic = body?.is_public !== false;

    if (!moduleId || !categoryId || !title || !fileUrl) {
      return NextResponse.json({ error: "module_id, category_id, title and file_url are required" }, { status: 400 });
    }

    let validatedDomains: string[] | null = null;
    if (Array.isArray(body?.allowed_domains) && body.allowed_domains.length > 0) {
      const filteredDomains = body.allowed_domains.filter(
        (d: string) => typeof d === "string" && ALLOWED_DOMAIN_OPTIONS.includes(d as (typeof ALLOWED_DOMAIN_OPTIONS)[number])
      );
      validatedDomains = filteredDomains.length > 0 ? filteredDomains : null;
    }

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("firebase_uid", user.uid)
      .single();

    const uploadedBy = userData?.id ?? null;

    const { data, error } = await supabaseAdmin
      .from("resources")
      .insert({
        module_id: moduleId,
        category_id: categoryId,
        folder_id: folderId,
        title,
        description,
        file_url: fileUrl,
        file_type: fileType,
        file_size_bytes: fileSizeBytes,
        storage_provider: storageProvider,
        storage_key: storageKey,
        is_public: isPublic,
        allowed_domains: validatedDomains,
        uploaded_by_user_id: uploadedBy,
        is_approved: false,
      })
      .select("id,title,file_url,category_id,folder_id,module_id,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: data,
      message: "Uploaded successfully. Waiting for admin approval to be visible to other students.",
    });
  } catch (error) {
    console.error("Error uploading resource metadata:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
