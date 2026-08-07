import { NextRequest, NextResponse } from "next/server";
import supabase from '../../../lib/supabase-admin';
import { authenticateRequest } from "@/lib/firebase-admin";

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

function canAccessVideo(userEmail: string | null, allowedDomains: string[] | null): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true;
  }

  if (!userEmail) {
    return false;
  }

  const parts = userEmail.split('@');
  if (parts.length < 2) return false;
  const userDomain = '@' + parts[1];

  return allowedDomains.includes(userDomain);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json({ error: "moduleId is required" }, { status: 400 });
    }

    // Domain access must come from a verified token — never from a query param
    const verifiedUser = await authenticateRequest(req.headers.get("authorization"));
    const userEmail = verifiedUser?.email ?? null;

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
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const queryData = (data || []) as unknown as VideoQueryResult[];

    const accessibleVideos = queryData.filter(video =>
      canAccessVideo(userEmail, video.allowed_domains)
    );

    return NextResponse.json(accessibleVideos);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
