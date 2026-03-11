import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase-admin';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
};

// GET - Fetch user by firebase_uid or email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('firebase_uid');
    const email = searchParams.get('email');

    if (!firebaseUid && !email) {
      return NextResponse.json({ error: 'firebase_uid or email is required' }, { status: 400 });
    }

    let query = supabaseAdmin.from('users').select('*');
    
    if (firebaseUid) {
      query = query.eq('firebase_uid', firebaseUid);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return NextResponse.json({ user: data || null });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// POST - Create or update user
export async function POST(request: NextRequest) {
  try {
    // Check Supabase configuration first
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured. Missing environment variables.');
      return NextResponse.json({ 
        error: 'Database not configured', 
        message: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 500 });
    }

    const body = await request.json();
    const { firebase_uid, email, display_name, photo_url, is_verified, auth_provider } = body;

    console.log('POST /api/users - Received:', { firebase_uid, email, display_name, auth_provider });

    if (!firebase_uid || !email) {
      return NextResponse.json({ error: 'firebase_uid and email are required' }, { status: 400 });
    }

    // First, check if user already exists by firebase_uid
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('firebase_uid', firebase_uid)
      .single();

    // Log fetch result (PGRST116 = no rows found, which is OK)
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing user:', fetchError);
      throw fetchError;
    }

    if (existingUser) {
      // User exists, update it
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          display_name: display_name || existingUser.display_name,
          photo_url: photo_url || existingUser.photo_url,
          is_verified: is_verified ?? existingUser.is_verified,
          auth_provider: auth_provider || existingUser.auth_provider,
          updated_at: new Date().toISOString()
        })
        .eq('firebase_uid', firebase_uid)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true,
        user: data 
      });
    }

    // Check if email already exists (for a different firebase user - shouldn't happen normally)
    const { data: emailExists } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (emailExists) {
      // Email already used by different account, update the firebase_uid
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          firebase_uid,
          display_name: display_name || null,
          photo_url: photo_url || null,
          is_verified: is_verified || false,
          auth_provider: auth_provider || 'email',
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ 
        success: true,
        user: data 
      });
    }

    // User doesn't exist, create new
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        firebase_uid,
        email,
        display_name: display_name || null,
        photo_url: photo_url || null,
        is_verified: is_verified || false,
        auth_provider: auth_provider || 'email',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      user: data 
    });
  } catch (error: unknown) {
    console.error('Error saving user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = typeof error === 'object' && error !== null ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error);
    return NextResponse.json({ 
      error: 'Failed to save user', 
      message: errorMessage,
      details: errorDetails,
      code: (error as { code?: string })?.code || ''
    }, { status: 500 });
  }
}

// PATCH - Update user verification status or other fields
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebase_uid, ...updateFields } = body;

    if (!firebase_uid) {
      return NextResponse.json({ error: 'firebase_uid is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        ...updateFields,
        updated_at: new Date().toISOString()
      })
      .eq('firebase_uid', firebase_uid)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      user: data 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
