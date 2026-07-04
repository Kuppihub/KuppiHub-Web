import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ALLOWED_DOMAIN_OPTIONS = ["@uom.lk", "@cse.mrt.ac.lk", "@gmail.com"] as const;

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const turnstileToken = body?.turnstileToken;
    if (!turnstileToken || typeof turnstileToken !== "string") {
      return NextResponse.json({ error: "Verification required" }, { status: 400 });
    }

    if (!process.env.TURNSTILE_SECRET_KEY) {
      console.error("Missing TURNSTILE_SECRET_KEY");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData?.success) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const moduleId = Number(body?.module_id);
    const categoryId = Number(body?.category_id);
    const folderId = body?.folder_id === null || body?.folder_id === undefined || body?.folder_id === "" ? null : Number(body.folder_id);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : null;
    const fileUrl = typeof body?.file_url === "string" ? body.file_url.trim() : "";
    const isPublic = body?.is_public !== false;

    if (!moduleId || Number.isNaN(moduleId) || !categoryId || Number.isNaN(categoryId) || !title || !fileUrl) {
      return NextResponse.json(
        { error: "module_id, category_id, title and file_url are required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      const parsedUrl = new URL(fileUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return NextResponse.json({ error: "Only http and https links are allowed" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Please enter a valid link/URL" }, { status: 400 });
    }

    let validatedDomains: string[] | null = null;
    if (Array.isArray(body?.allowed_domains) && body.allowed_domains.length > 0) {
      const filtered = body.allowed_domains
        .filter((v: any): v is string => typeof v === "string")
        .map((v: string) => v.trim())
        .filter((v: string) => ALLOWED_DOMAIN_OPTIONS.includes(v as (typeof ALLOWED_DOMAIN_OPTIONS)[number]));

      validatedDomains = filtered.length > 0 ? filtered : null;
    }

    const { data, error } = await supabaseAdmin
      .from("resources")
      .insert({
        module_id: moduleId,
        category_id: categoryId,
        folder_id: folderId,
        title,
        description,
        file_url: fileUrl,
        file_type: "link",
        file_size_bytes: null,
        storage_provider: "link",
        storage_key: fileUrl,
        is_public: isPublic,
        allowed_domains: validatedDomains,
        uploaded_by_user_id: null,
        is_approved: false,
      })
      .select("id,title,file_url,category_id,folder_id,module_id,created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This resource link has already been submitted." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: data,
      message: "Link submitted successfully. Pending admin approval to be visible to other students.",
    });
  } catch (error) {
    console.error("Error submitting link:", error);
    return NextResponse.json({ error: "Failed to submit link" }, { status: 500 });
  }
}
