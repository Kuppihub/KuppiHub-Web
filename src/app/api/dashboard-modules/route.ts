import { NextRequest, NextResponse } from "next/server";
import supabase from "../../../lib/supabase-admin";

interface ModuleData {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

interface VideoCount {
  module_id: number;
}

export async function GET(req: NextRequest) {
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

    const typedModules = (modulesData || []) as ModuleData[];

    // Fetch video counts for each module
    const { data: videoCounts, error: videoError } = await supabase
      .from("videos")
      .select("module_id")
      .in("module_id", moduleIds);

    const typedVideoCounts = (videoCounts || []) as VideoCount[];

    // Count videos per module
    const countMap: Record<number, number> = {};
    if (typedVideoCounts) {
      typedVideoCounts.forEach((v) => {
        countMap[v.module_id] = (countMap[v.module_id] || 0) + 1;
      });
    }

    // Transform to match expected format
    const transformedData = typedModules.map((item) => ({
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
  } catch (err: any) {
    console.error("Dashboard modules API error:", err);
    return NextResponse.json({ error: err?.message || "Something went wrong" }, { status: 500 });
  }
}
