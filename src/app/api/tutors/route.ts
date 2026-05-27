import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase-admin';

interface Video {
  id: number;
  title: string;
  module_id: number;
  is_approved: boolean;
  is_hidden: boolean | null;
  modules: {
    name: string;
  } | null;
}

interface StudentQueryResult {
  id: number;
  name: string;
  image_url: string | null;
  linkedin_url: string | null;
  approved: boolean;
  faculty: {
    name: string;
  } | null;
  department?: {
    name: string;
  } | null;
  videos: Video[];
}

export async function GET() {
  try {
    // Fetch all students with related info
    // Only count videos that are approved and not hidden
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        image_url,
        linkedin_url,
        approved,
        faculty:faculties(name),
       
        videos:videos!inner(id, title, module_id, is_approved, is_hidden, modules(name))
      `)
      .eq('approved', true)
      .neq('name', 'Unknown');  // filter out students with name = 'Unknown'

    if (error) throw error;

    const queryData = (data || []) as unknown as StudentQueryResult[];

    // Map to get number of visible/approved videos and unique module names
    const students = queryData
      .map(student => {
        // Filter videos to only count approved and visible ones
        const visibleVideos = (student.videos || []).filter(
          (v: Video) => v.is_approved === true && v.is_hidden !== true
        );

        const moduleNames = Array.from(
          new Set(
            visibleVideos
              .map((v: Video) => v.modules?.name)
              .filter((name): name is string => Boolean(name))
          )
        );

        let name = student.name;
        if (name === 'Unknown') {
          name = 'Student';
        }

        return {
          id: student.id,
          name,
          image_url: student.image_url,
          linkedin_url: student.linkedin_url,
          faculty: student.faculty?.name || null,
          department: student.department?.name || null,
          video_count: visibleVideos.length,
          modules_done: moduleNames,
        };
      })
      .filter(student => student.video_count > 0); // only include students with at least 1 visible video

    return NextResponse.json({ students }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Something went wrong' }, { status: 500 });
  }
}
