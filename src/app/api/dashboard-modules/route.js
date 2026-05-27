import { NextResponse } from "next/server";
import supabase from "../../../lib/supabase-admin";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ error: "ids parameter is required" }, { status: 400 });
    }

    // Parse comma-separated module IDs
    const moduleIds = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (moduleIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch modules from the modules table
    const { data: modulesData, error: modulesError } = await supabase
      .from("modules")
      .select("id, code, name, description")
      .in("id", moduleIds);

    if (modulesError) {
      console.error("Error fetching modules:", modulesError);
      return NextResponse.json({ error: modulesError.message }, { status: 500 });
    }

    // Fetch video counts for each module
    const { data: videoCounts, error: videoError } = await supabase
      .from("videos")
      .select("module_id")
      .in("module_id", moduleIds);

    // Count videos per module
    const countMap = {};
    if (videoCounts) {
      videoCounts.forEach((v) => {
        countMap[v.module_id] = (countMap[v.module_id] || 0) + 1;
      });
    }

    // Transform to match expected format
    const transformedData = modulesData.map((item) => ({
      module_id: item.id,
      module: {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description || "",
      },
      video_count: countMap[item.id] || 0,
    }));

    return NextResponse.json(transformedData);
  } catch (err) {
    console.error("Dashboard modules API error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
