import { NextResponse } from "next/server";
import supabase from "../../../lib/supabase-admin";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ data: [] });
  }

  // search only in module name or module code
  const ilikeQuery = `name.ilike.%${q}%,code.ilike.%${q}%`;

  const { data, error } = await supabase
    .from("modules_search_mv")
    .select("id,code,name,video_count")
    .or(ilikeQuery)
    .limit(50);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
