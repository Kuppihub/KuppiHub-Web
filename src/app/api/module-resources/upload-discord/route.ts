import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ALLOWED_DOMAIN_OPTIONS = ["@uom.lk", "@cse.mrt.ac.lk", "@gmail.com"] as const;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

function parseBoolean(value: FormDataEntryValue | null, defaultValue: boolean) {
  if (typeof value !== "string") return defaultValue;
  const v = value.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultValue;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const channelId = process.env.DISCORD_UPLOAD_CHANNEL_ID?.trim();
    const maxFileBytes = Number(process.env.DISCORD_MAX_FILE_BYTES || DEFAULT_MAX_BYTES);

    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: "Discord upload is not configured on server" },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const turnstileToken = formData.get("turnstileToken");
    if (!turnstileToken || typeof turnstileToken !== "string") {
      return NextResponse.json({ error: "Verification required" }, { status: 400 });
    }

    if (!process.env.TURNSTILE_SECRET_KEY) {
      console.error('Missing TURNSTILE_SECRET_KEY');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData?.success) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const moduleId = Number(formData.get("module_id"));
    const categoryId = Number(formData.get("category_id"));
    const folderIdRaw = formData.get("folder_id");
    const folderId = folderIdRaw === null || folderIdRaw === "" ? null : Number(folderIdRaw);

    const titleRaw = formData.get("title");
    const descriptionRaw = formData.get("description");
    const isPublic = parseBoolean(formData.get("is_public"), true);

    const file = formData.get("file");

    const title = typeof titleRaw === "string" ? titleRaw.trim() : "";
    const description = typeof descriptionRaw === "string" ? descriptionRaw.trim() : null;

    if (!moduleId || Number.isNaN(moduleId) || !categoryId || Number.isNaN(categoryId) || !title) {
      return NextResponse.json(
        { error: "module_id, category_id and title are required" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "file is empty" }, { status: 400 });
    }

    if (file.size > maxFileBytes) {
      return NextResponse.json(
        { error: `file exceeds max allowed size (${maxFileBytes} bytes)` },
        { status: 400 }
      );
    }

    const allowedExtensions = [".pdf", ".zip", ".doc", ".docx"];
    const allowedMimeTypes = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    const fileNameLower = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some(ext => fileNameLower.endsWith(ext));
    const hasAllowedMimeType = allowedMimeTypes.includes(file.type);

    if (!hasAllowedExtension && !hasAllowedMimeType) {
      return NextResponse.json(
        { error: "Only PDF, ZIP, and Word Documents are allowed" },
        { status: 400 }
      );
    }

    let validatedDomains: string[] | null = null;
    const allowedDomainsRaw = formData.getAll("allowed_domains");
    if (allowedDomainsRaw.length > 0) {
      const filtered = allowedDomainsRaw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => ALLOWED_DOMAIN_OPTIONS.includes(v as (typeof ALLOWED_DOMAIN_OPTIONS)[number]));

      validatedDomains = filtered.length > 0 ? filtered : null;
    }

    const discordBody = new FormData();
    discordBody.append("file", file, file.name);
    discordBody.append(
      "payload_json",
      JSON.stringify({
        content: `resource-upload|module:${moduleId}|category:${categoryId}|title:${title}`,
      })
    );

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      body: discordBody,
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return NextResponse.json(
        { error: "Failed to upload file to Discord", details: errText },
        { status: 502 }
      );
    }

    const discordJson = await discordRes.json();
    const attachment = Array.isArray(discordJson.attachments) ? discordJson.attachments[0] : null;

    if (!attachment?.url) {
      return NextResponse.json(
        { error: "Discord upload succeeded but no attachment URL returned" },
        { status: 502 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("resources")
      .insert({
        module_id: moduleId,
        category_id: categoryId,
        folder_id: folderId,
        title,
        description,
        file_url: attachment.url,
        file_type: file.type || null,
        file_size_bytes: file.size,
        storage_provider: "discord",
        storage_key: String(attachment.id || discordJson.id || ""),
        is_public: isPublic,
        allowed_domains: validatedDomains,
        uploaded_by_user_id: null,
        is_approved: false,
      })
      .select("id,title,file_url,is_approved,module_id,category_id,folder_id,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: data,
      discord: {
        message_id: discordJson.id,
        attachment_id: attachment.id,
        cdn_url: attachment.url,
      },
      message: "Resource uploaded successfully! Pending admin approval.",
    });
  } catch (error) {
    console.error("Error uploading resource via Discord:", error);
    return NextResponse.json({ error: "Failed to upload resource" }, { status: 500 });
  }
}
