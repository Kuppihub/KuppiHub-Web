import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase-admin';
import { authenticateRequest } from '@/lib/firebase-admin';

async function getUserId(firebaseUid: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error || !data) return null;
  return data.id;
}

async function requireUser(request: NextRequest) {
  return authenticateRequest(request.headers.get('authorization'));
}

// GET - Fetch authenticated user's dashboard modules
export async function GET(request: NextRequest) {
  try {
    const verifiedUser = await requireUser(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(verifiedUser.uid);
    if (!userId) {
      return NextResponse.json({ moduleIds: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('user_dashboard_modules')
      .select('module_ids')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      moduleIds: data?.module_ids || [],
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}

// POST - Save authenticated user's dashboard modules
export async function POST(request: NextRequest) {
  try {
    const verifiedUser = await requireUser(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleIds } = body;

    if (moduleIds !== undefined && !Array.isArray(moduleIds)) {
      return NextResponse.json({ error: 'moduleIds must be an array' }, { status: 400 });
    }

    const safeModuleIds = Array.isArray(moduleIds)
      ? moduleIds.filter((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0)
      : [];

    const userId = await getUserId(verifiedUser.uid);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_dashboard_modules')
      .upsert(
        {
          user_id: userId,
          module_ids: safeModuleIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error saving user dashboard:', error);
    return NextResponse.json({ error: 'Failed to save dashboard' }, { status: 500 });
  }
}
