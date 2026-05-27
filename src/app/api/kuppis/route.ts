import { NextRequest, NextResponse } from "next/server";
import supabase from '../../../lib/supabase-admin';

interface VideoQueryResult {
  id: number;
  title: string;
  youtube_links: string[] | null;
  telegram_links: string[] | null;
  material_urls: string[] | null;
  onedrive_cloud_video_urls: string[] | null;
  gdrive_cloud_video_urls: string[] | null;
  is_kuppi: boolean;
  description: string;
  language_code: string;
  created_at: string;
  published_at: string;
  allowed_domains: string[] | null;
  owner: {
    name: string;
  } | null;
}

// Helper function to check if user's email domain is allowed
function canAccessVideo(userEmail: string | null, allowedDomains: string[] | null): boolean {
  // If no domain restrictions, video is public
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }
  
  // If user is not logged in, they can't access restricted content
  if (!userEmail) {
    return false;
  }
  
  // Extract domain from email (e.g., 'user@uom.lk' -> '@uom.lk')
  const parts = userEmail.split('@');
  if (parts.length < 2) return false;
  const userDomain = '@' + parts[1];
  
  // Check if user's domain is in the allowed list
  return allowedDomains.includes(userDomain);
}

export async function GET(req: NextRequest) {
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
      // Primary sort: published date (newest first)
      // Tie-breakers: latest upload timestamp, then id
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const queryData = (data || []) as unknown as VideoQueryResult[];

    // Filter videos based on user's email domain access
    const accessibleVideos = queryData.filter(video => 
      canAccessVideo(userEmail, video.allowed_domains)
    );

    return NextResponse.json(accessibleVideos);

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Something went wrong' }, { status: 500 });
  }
}
