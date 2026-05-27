import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../lib/supabase-admin";

interface SearchResult {
  id: number;
  title: string;
  description: string;
  module_id: number;
  module_code: string;
  module_name: string;
  module_description: string;
  student_name: string;
  is_approved: boolean;
  is_hidden: boolean;
  created_at: string;
  published_at: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ data: [] });
  }

  // Combine multiple ilike conditions properly for Supabase
  const ilikeQuery = `title.ilike.%${query}%,description.ilike.%${query}%,module_code.ilike.%${query}%,module_name.ilike.%${query}%,module_description.ilike.%${query}%,student_name.ilike.%${query}%`;

  const { data, error } = await supabase
    .from("videos_search_mv")
    .select("*")
    .or(ilikeQuery)
    .eq("is_hidden", false)
    .eq("is_approved", true)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const typedData = (data || []) as SearchResult[];

  return NextResponse.json({ data: typedData });
}
