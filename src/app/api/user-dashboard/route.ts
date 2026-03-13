import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase-admin';

// Helper function to get user_id from firebase_uid
async function getUserId(firebaseUid: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('firebase_uid', firebaseUid)
    .single();
  
  if (error || !data) return null;
  return data.id;
}

// GET - Fetch user's dashboard modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('firebase_uid');

    if (!firebaseUid) {
      return NextResponse.json({ error: 'firebase_uid is required' }, { status: 400 });
    }

    // Get user_id from firebase_uid
    const userId = await getUserId(firebaseUid);
    if (!userId) {
      return NextResponse.json({ moduleIds: [] }); // User not found, return empty
    }

    const { data, error } = await supabaseAdmin
      .from('user_dashboard_modules')
      .select('module_ids')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return NextResponse.json({ 
      moduleIds: data?.module_ids || [] 
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}

// POST - Save user's dashboard modules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebase_uid, moduleIds } = body;

    if (!firebase_uid) {
      return NextResponse.json({ error: 'firebase_uid is required' }, { status: 400 });
    }

    // Get user_id from firebase_uid
    const userId = await getUserId(firebase_uid);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert - insert or update if exists
    const { data, error } = await supabaseAdmin
      .from('user_dashboard_modules')
      .upsert(
        { 
          user_id: userId, 
          module_ids: moduleIds || [],
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      data 
    });
  } catch (error) {
    console.error('Error saving user dashboard:', error);
    return NextResponse.json({ error: 'Failed to save dashboard' }, { status: 500 });
  }
}
