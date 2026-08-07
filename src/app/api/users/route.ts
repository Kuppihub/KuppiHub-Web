import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase-admin';
import { authenticateRequest } from '@/lib/firebase-admin';

const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
};

const PROFILE_SELECT =
  'id,firebase_uid,email,display_name,photo_url,is_verified,auth_provider,is_approved_for_kuppies,created_at,updated_at';

const ALLOWED_PATCH_FIELDS = new Set(['display_name', 'photo_url']);

async function requireVerifiedUser(request: NextRequest) {
  return authenticateRequest(request.headers.get('authorization'));
}

// GET - Fetch the authenticated user's profile only
export async function GET(request: NextRequest) {
  try {
    const verifiedUser = await requireVerifiedUser(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('firebase_uid', verifiedUser.uid)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ user: data || null });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// POST - Create or update the authenticated user's own profile
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured. Missing environment variables.');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const verifiedUser = await requireVerifiedUser(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!verifiedUser.email) {
      return NextResponse.json({ error: 'Authenticated email is required' }, { status: 400 });
    }

    const body = await request.json();
    const { display_name, photo_url, auth_provider } = body;

    // Never trust client identity claims — bind to verified token only
    const firebase_uid = verifiedUser.uid;
    const email = verifiedUser.email;
    const is_verified = verifiedUser.emailVerified;
    const safeDisplayName =
      typeof display_name === 'string'
        ? display_name
        : verifiedUser.displayName || null;
    const safePhotoUrl =
      typeof photo_url === 'string' ? photo_url : verifiedUser.photoURL || null;
    const safeAuthProvider =
      typeof auth_provider === 'string' && ['google', 'github', 'email'].includes(auth_provider)
        ? auth_provider
        : 'email';

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(PROFILE_SELECT)
      .eq('firebase_uid', firebase_uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing user:', fetchError);
      throw fetchError;
    }

    if (existingUser) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          email,
          display_name: safeDisplayName || existingUser.display_name,
          photo_url: safePhotoUrl || existingUser.photo_url,
          is_verified,
          auth_provider: safeAuthProvider || existingUser.auth_provider,
          updated_at: new Date().toISOString(),
        })
        .eq('firebase_uid', firebase_uid)
        .select(PROFILE_SELECT)
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        user: data,
      });
    }

    // Block account takeover: never rebind an existing email to a different Firebase UID
    const { data: emailExists } = await supabaseAdmin
      .from('users')
      .select('id,firebase_uid')
      .eq('email', email)
      .maybeSingle();

    if (emailExists && emailExists.firebase_uid !== firebase_uid) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        firebase_uid,
        email,
        display_name: safeDisplayName,
        photo_url: safePhotoUrl,
        is_verified,
        auth_provider: safeAuthProvider,
      })
      .select(PROFILE_SELECT)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error: unknown) {
    console.error('Error saving user:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}

// PATCH - Update safe profile fields for the authenticated user only
export async function PATCH(request: NextRequest) {
  try {
    const verifiedUser = await requireVerifiedUser(request);
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateFields: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body || {})) {
      if (!ALLOWED_PATCH_FIELDS.has(key)) continue;
      if (typeof value === 'string' || value === null) {
        updateFields[key] = value;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Keep verification in sync with Firebase; never accept client is_admin / is_verified
    updateFields.is_verified = verifiedUser.emailVerified;
    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateFields)
      .eq('firebase_uid', verifiedUser.uid)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
