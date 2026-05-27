import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase-admin';

interface ModuleRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

// GET /api/modules-by-ids?ids=1,2,3,4,5 - Fetch modules by their IDs
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }

    // Parse the comma-separated IDs into an array of numbers
    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No valid IDs provided' },
        { status: 400 }
      );
    }

    // Fetch modules with video counts
    const { data, error } = await supabase
      .from('modules')
      .select(`
        id,
        code,
        name,
        description
      `)
      .in('id', ids);

    if (error) {
      console.error('Error fetching modules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch modules' },
        { status: 500 }
      );
    }

    // Fetch video counts for each module
    const modulesWithCounts = await Promise.all(
      ((data as ModuleRow[]) || []).map(async (module: ModuleRow) => {
        const { count } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('module_id', module.id);

        return {
          module_id: module.id,
          module: {
            id: module.id,
            code: module.code,
            name: module.name,
            description: module.description,
          },
          video_count: count || 0,
        };
      })
    );

    return NextResponse.json(modulesWithCounts);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
