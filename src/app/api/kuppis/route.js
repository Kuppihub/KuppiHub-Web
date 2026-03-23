import { NextResponse } from "next/server";
import supabase from '../../../lib/supabase';

// Helper function to check if user's email domain is allowed
function canAccessVideo(userEmail, allowedDomains) {
  // If no domain restrictions, video is public
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }
  
  // If user is not logged in, they can't access restricted content
  if (!userEmail) {
    return false;
  }
  
  // Extract domain from email (e.g., 'user@uom.lk' -> '@uom.lk')
  const userDomain = '@' + userEmail.split('@')[1];
  
  // Check if user's domain is in the allowed list
  return allowedDomains.includes(userDomain);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");
    const userEmail = searchParams.get("userEmail"); // Pass logged-in user's email

    if (!moduleId) {
      return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
    }

    // Fetch videos - only show visible and approved kuppis
    // Filter: is_hidden = false AND is_approved = true
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        youtube_links,
        telegram_links,
        material_urls,
        onedrive_cloud_video_urls,
        gdrive_cloud_video_urls,
        is_kuppi,
        description,
        language_code,
        created_at,
        published_at,
        allowed_domains,
        owner:students(
          name
        )
      `)
      .eq('module_id', Number(moduleId))
      .eq('is_hidden', false)
      .eq('is_approved', true)
      .order('published_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter videos based on user's email domain access
    const accessibleVideos = data.filter(video => 
      canAccessVideo(userEmail, video.allowed_domains)
    );

    return NextResponse.json(accessibleVideos);

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Something went wrong' }, { status: 500 });
  }
}
