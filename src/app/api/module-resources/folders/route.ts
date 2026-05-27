import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabase-admin";
import { authenticateRequest } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req.headers.get("authorization"));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const moduleId = Number(body?.module_id);
    const categoryId = Number(body?.category_id);
    const parentId = body?.parent_id === null || body?.parent_id === undefined ? null : Number(body.parent_id);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!moduleId || !categoryId || !name) {
      return NextResponse.json({ error: "module_id, category_id and name are required" }, { status: 400 });
    }

    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("firebase_uid", user.uid)
      .single();

    const createdBy = userData?.id ?? null;

    const { data, error } = await supabaseAdmin
      .from("resource_folders")
      .insert({
        module_id: moduleId,
        category_id: categoryId,
        parent_id: parentId,
        name,
        created_by_user_id: createdBy,
      })
      .select("id,name,parent_id,module_id,category_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, folder: data });
  } catch (error) {
    console.error("Error creating resource folder:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
