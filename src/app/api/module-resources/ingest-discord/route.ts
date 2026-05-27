import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";

const ALLOWED_DOMAIN_OPTIONS = ["@uom.lk", "@cse.mrt.ac.lk", "@gmail.com"] as const;

function getBotSecret(req: NextRequest): string | null {
  const value = req.headers.get("x-bot-secret");
  return value ? value.trim() : null;
}

export async function POST(req: NextRequest) {
  try {
    const configuredSecret = process.env.DISCORD_BOT_INGEST_SECRET?.trim();
    if (!configuredSecret) {
      return NextResponse.json({ error: "Bot ingest is not configured" }, { status: 500 });
    }

    const incomingSecret = getBotSecret(req);
    if (!incomingSecret || incomingSecret !== configuredSecret) {
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

    const discordAttachmentId = typeof body?.discord_attachment_id === "string" ? body.discord_attachment_id.trim() : null;
    const discordMessageId = typeof body?.discord_message_id === "string" ? body.discord_message_id.trim() : null;

    const isPublic = body?.is_public !== false;

    if (!moduleId || Number.isNaN(moduleId) || !categoryId || Number.isNaN(categoryId) || !title || !fileUrl) {
      return NextResponse.json(
        { error: "module_id, category_id, title and file_url are required" },
        { status: 400 }
      );
    }

    let validatedDomains: string[] | null = null;
    if (Array.isArray(body?.allowed_domains) && body.allowed_domains.length > 0) {
      const filteredDomains = body.allowed_domains.filter(
        (d: string) => typeof d === "string" && ALLOWED_DOMAIN_OPTIONS.includes(d as (typeof ALLOWED_DOMAIN_OPTIONS)[number])
      );
      validatedDomains = filteredDomains.length > 0 ? filteredDomains : null;
    }

    const storageKey = discordAttachmentId || discordMessageId || null;

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
        storage_provider: "discord",
        storage_key: storageKey,
        is_public: isPublic,
        allowed_domains: validatedDomains,
        uploaded_by_user_id: null,
        is_approved: false,
      })
      .select("id,module_id,category_id,folder_id,title,file_url,is_approved,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: data,
      message: "Ingested from Discord. Pending admin approval.",
    });
  } catch (error) {
    console.error("Error ingesting Discord resource:", error);
    return NextResponse.json({ error: "Failed to ingest resource" }, { status: 500 });
  }
}
