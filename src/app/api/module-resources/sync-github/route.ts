import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import supabaseAdmin from "@/lib/supabase-admin";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

interface CommitFilePayload {
  added?: string[];
  modified?: string[];
  removed?: string[];
}

interface CommitPayload {
  added?: string[];
  modified?: string[];
  removed?: string[];
}

function verifySignature(reqBody: string, signature: string | null): boolean {
  if (!GITHUB_WEBHOOK_SECRET || !signature) {
    console.warn("GitHub Webhook secret is not configured or signature is missing");
    return false;
  }
  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(reqBody).digest("hex");
  const digestBuf = Buffer.from(digest);
  const signatureBuf = Buffer.from(signature);
  if (digestBuf.length !== signatureBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(digestBuf, signatureBuf);
}

function formatTitle(fileName: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, ""); // Strip extension
  return baseName
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Secure webhook signature check
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Only process pushes on the main/master branch
    const ref = payload.ref || "";
    if (ref !== "refs/heads/main" && ref !== "refs/heads/master") {
      return NextResponse.json({ message: "Not main or master branch, skipping sync" });
    }

    const commits = (payload.commits || []) as CommitPayload[];
    const filesToSync: Set<string> = new Set();
    const filesToRemove: Set<string> = new Set();

    for (const commit of commits) {
      commit.added?.forEach((f: string) => {
        filesToSync.add(f);
        filesToRemove.delete(f);
      });
      commit.modified?.forEach((f: string) => {
        filesToSync.add(f);
        filesToRemove.delete(f);
      });
      commit.removed?.forEach((f: string) => {
        filesToRemove.add(f);
        filesToSync.delete(f);
      });
    }

    if (filesToSync.size === 0 && filesToRemove.size === 0) {
      return NextResponse.json({ message: "No relevant files modified" });
    }

    // Cache categories mapping to optimize DB operations
    const { data: categories, error: catError } = await supabaseAdmin
      .from("resource_categories")
      .select("id, slug");

    if (catError) {
      console.error("Failed to load resource categories:", catError);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    const categoryMap = new Map(categories?.map((c) => [c.slug, c.id]) || []);
    const repoFullName = payload.repository?.full_name || "Kuppihub/kuppihub-resources";
    const rawBaseUrl = `https://raw.githubusercontent.com/${repoFullName}/main`;

    // 1. Process Removed Files (Set as inactive in database)
    if (filesToRemove.size > 0) {
      const pathsToRemove = Array.from(filesToRemove);
      const { error: deleteError } = await supabaseAdmin
        .from("resources")
        .update({ is_active: false })
        .in("storage_key", pathsToRemove)
        .eq("storage_provider", "github");

      if (deleteError) {
        console.error("Error setting resources to inactive:", deleteError.message);
      }
    }

    // 2. Process Added and Modified Files
    let syncCount = 0;
    for (const filePath of filesToSync) {
      const parts = filePath.split("/");
      if (parts.length < 3) continue; // Skip top-level files (e.g. README.md)

      const moduleCode = parts[0].toUpperCase();
      const categorySlug = parts[1].toLowerCase();
      const fileName = parts.slice(2).join("/");

      // Fetch the module ID by code
      const { data: moduleData, error: modError } = await supabaseAdmin
        .from("modules")
        .select("id")
        .eq("code", moduleCode)
        .single();

      if (modError || !moduleData) {
        console.warn(`Module code ${moduleCode} not found in DB. Skipping ${filePath}`);
        continue;
      }

      const categoryId = categoryMap.get(categorySlug);
      if (!categoryId) {
        console.warn(`Category slug ${categorySlug} not found in DB. Skipping ${filePath}`);
        continue;
      }

      const fileUrl = `${rawBaseUrl}/${filePath.split("/").map(encodeURIComponent).join("/")}`;
      const fileType = fileName.split(".").pop() || null;
      const title = formatTitle(fileName);

      // Upsert resource record into Supabase
      const { error: upsertError } = await supabaseAdmin
        .from("resources")
        .upsert(
          {
            module_id: moduleData.id,
            category_id: categoryId,
            title,
            description: `Contributed via GitHub repository: ${filePath}`,
            file_url: fileUrl,
            file_type: fileType,
            storage_provider: "github",
            storage_key: filePath,
            is_approved: true, // Auto-approved since maintainer merged PR
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "storage_provider,storage_key" }
        );

      if (upsertError) {
        console.error(`Failed to upsert file ${filePath}:`, upsertError.message);
      } else {
        syncCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: syncCount,
      removed: filesToRemove.size,
    });
  } catch (error) {
    console.error("GitHub Sync Webhook Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
