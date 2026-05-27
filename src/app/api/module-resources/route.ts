import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

function canAccessResource(userEmail: string | null, isPublic: boolean, allowedDomains: string[] | null) {
  if (isPublic || !allowedDomains || allowedDomains.length === 0) return true;
  if (!userEmail || !userEmail.includes("@")) return false;
  const userDomain = `@${userEmail.split("@")[1]}`;
  return allowedDomains.includes(userDomain);
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const moduleId = Number(searchParams.get("moduleId"));
    const categoryIdParam = searchParams.get("categoryId");
    const parentFolderIdParam = searchParams.get("parentFolderId");
    const userEmail = user.email ?? null;

    if (!moduleId || Number.isNaN(moduleId)) {
      return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
    }

    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from("resource_categories")
      .select("id,name,slug,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    const categoryId = categoryIdParam ? Number(categoryIdParam) : categories?.[0]?.id;
    if (!categoryId) {
      return NextResponse.json({ categories: [], folders: [], resources: [], activeCategoryId: null });
    }

    const { data: moduleData } = await supabaseAdmin
      .from("modules")
      .select("code,name")
      .eq("id", moduleId)
      .single();

    const parentFolderId =
      parentFolderIdParam === null ? null : parentFolderIdParam === "" ? null : Number(parentFolderIdParam);

    let foldersQuery = supabaseAdmin
      .from("resource_folders")
      .select("id,name,parent_id,category_id,module_id,sort_order")
      .eq("module_id", moduleId)
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    foldersQuery = parentFolderId === null
      ? foldersQuery.is("parent_id", null)
      : foldersQuery.eq("parent_id", parentFolderId);

    const { data: folders, error: foldersError } = await foldersQuery;
    if (foldersError) {
      return NextResponse.json({ error: foldersError.message }, { status: 500 });
    }

    let resourcesQuery = supabaseAdmin
      .from("resources")
      .select("id,title,description,file_url,file_type,file_size_bytes,storage_provider,allowed_domains,is_public,created_at")
      .eq("module_id", moduleId)
      .eq("category_id", categoryId)
      .eq("is_approved", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    resourcesQuery = parentFolderId === null
      ? resourcesQuery.is("folder_id", null)
      : resourcesQuery.eq("folder_id", parentFolderId);

    const { data: allResources, error: resourcesError } = await resourcesQuery;
    if (resourcesError) {
      return NextResponse.json({ error: resourcesError.message }, { status: 500 });
    }

    const resources = (allResources || []).filter((r) =>
      canAccessResource(userEmail, r.is_public, r.allowed_domains)
    );

    return NextResponse.json({
      categories: categories || [],
      folders: folders || [],
      resources,
      activeCategoryId: categoryId,
      activeParentFolderId: parentFolderId,
      moduleCode: moduleData?.code ?? "",
      moduleName: moduleData?.name ?? "",
    });
  } catch (error) {
    console.error("Error loading module resources:", error);
    return NextResponse.json({ error: "Failed to load resources" }, { status: 500 });
  }
}
