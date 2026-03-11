import supabase from '../../../lib/supabase';

export async function GET() {
  try {
    // Fetch all students with related info
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        image_url,
        linkedin_url,
        faculty:faculties(name),
        department:departments(name),
        videos:videos(id, title, module_id, modules(name))
      `)
      .neq('name', 'Unknown');  // filter out students with name = 'Unknown'

    if (error) throw error;

    // Map to get number of videos and unique module names
    const students = data
      .map(student => {
        const moduleNames = Array.from(
          new Set(
            (student.videos || [])
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
          video_count: (student.videos || []).length,
          modules_done: moduleNames,
        };
      })
      .filter(student => student.video_count > 0); // only include students with at least 1 video

    return new Response(JSON.stringify({ students }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
