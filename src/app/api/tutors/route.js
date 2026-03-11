import supabase from '../../../lib/supabase';

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
        faculty:faculties(name),
       
        videos:videos!inner(id, title, module_id, is_approved, is_hidden, modules(name))
      `)
      .neq('name', 'Unknown');  // filter out students with name = 'Unknown'

    if (error) throw error;

    // Map to get number of visible/approved videos and unique module names
    const students = data
      .map(student => {
        // Filter videos to only count approved and visible ones
        const visibleVideos = (student.videos || []).filter(
          v => v.is_approved === true && v.is_hidden !== true
        );

        const moduleNames = Array.from(
          new Set(
            visibleVideos
              .map(v => v.modules?.name)
              .filter(Boolean)
          )
        );

        if (student.name === 'Unknown') {
          student.name = 'Student';
        }

        return {
          id: student.id,
          name: student.name,
          image_url: student.image_url,
          linkedin_url: student.linkedin_url,
          faculty: student.faculty?.name || null,
          department: student.department?.name || null,
          video_count: visibleVideos.length,
          modules_done: moduleNames,
        };
      })
      .filter(student => student.video_count > 0); // only include students with at least 1 visible video

    return new Response(JSON.stringify({ students }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
