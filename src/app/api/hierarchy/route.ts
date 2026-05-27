import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase-admin';
export const dynamic = "force-dynamic";

// GET /api/hierarchy - Fetch the faculty hierarchy JSONB data
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('faculty_hierarchy')
      .select('data')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching hierarchy:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hierarchy data' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Hierarchy data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data.data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "Vary": "Accept-Encoding",
      },
});

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/hierarchy - Update module IDs at a specific path
// Body: { path: ["engineering", "children", "cse", "children", "s3", "modules"], moduleIds: [34, 35, 36, 250] }
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { path, moduleIds } = body;

    if (!path || !Array.isArray(path) || !Array.isArray(moduleIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Required: path (array), moduleIds (array)' },
        { status: 400 }
      );
    }

    // Get current data first
    const { data: currentData, error: fetchError } = await supabase
      .from('faculty_hierarchy')
      .select('id, data')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !currentData) {
      return NextResponse.json(
        { error: 'Failed to fetch current hierarchy' },
        { status: 500 }
      );
    }

    // Update the nested path manually
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedData = JSON.parse(JSON.stringify(currentData.data)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = updatedData;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        return NextResponse.json(
          { error: `Invalid path: ${path.slice(0, i + 1).join('.')} does not exist` },
          { status: 400 }
        );
      }
      current = current[path[i]];
    }
    
    const lastKey = path[path.length - 1];
    current[lastKey] = moduleIds;

    // Update in database
    const { error: updateError } = await supabase
      .from('faculty_hierarchy')
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq('id', currentData.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update hierarchy' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Hierarchy updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/hierarchy - Add a single module ID to a path
// Body: { path: ["engineering", "children", "cse", "children", "s3", "modules"], moduleId: 250 }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, moduleId } = body;

    if (!path || !Array.isArray(path) || typeof moduleId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request. Required: path (array), moduleId (number)' },
        { status: 400 }
      );
    }

    // Get current data
    const { data: currentData, error: fetchError } = await supabase
      .from('faculty_hierarchy')
      .select('id, data')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !currentData) {
      return NextResponse.json(
        { error: 'Failed to fetch current hierarchy' },
        { status: 500 }
      );
    }

    // Navigate to the modules array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedData = JSON.parse(JSON.stringify(currentData.data)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = updatedData;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        return NextResponse.json(
          { error: `Invalid path: ${path.slice(0, i + 1).join('.')} does not exist` },
          { status: 400 }
        );
      }
      current = current[path[i]];
    }
    
    const lastKey = path[path.length - 1];
    
    if (!Array.isArray(current[lastKey])) {
      return NextResponse.json(
        { error: 'Target path is not an array' },
        { status: 400 }
      );
    }

    // Add module if not already present
    if (!current[lastKey].includes(moduleId)) {
      current[lastKey].push(moduleId);
    }

    // Update in database
    const { error: updateError } = await supabase
      .from('faculty_hierarchy')
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq('id', currentData.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update hierarchy' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Module ${moduleId} added successfully`,
      modules: current[lastKey]
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/hierarchy - Remove a module ID from a path
// Body: { path: ["engineering", "children", "cse", "children", "s3", "modules"], moduleId: 250 }
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { path, moduleId } = body;

    if (!path || !Array.isArray(path) || typeof moduleId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request. Required: path (array), moduleId (number)' },
        { status: 400 }
      );
    }

    // Get current data
    const { data: currentData, error: fetchError } = await supabase
      .from('faculty_hierarchy')
      .select('id, data')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !currentData) {
      return NextResponse.json(
        { error: 'Failed to fetch current hierarchy' },
        { status: 500 }
      );
    }

    // Navigate to the modules array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedData = JSON.parse(JSON.stringify(currentData.data)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = updatedData;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        return NextResponse.json(
          { error: `Invalid path: ${path.slice(0, i + 1).join('.')} does not exist` },
          { status: 400 }
        );
      }
      current = current[path[i]];
    }
    
    const lastKey = path[path.length - 1];
    
    if (!Array.isArray(current[lastKey])) {
      return NextResponse.json(
        { error: 'Target path is not an array' },
        { status: 400 }
      );
    }

    // Remove module
    current[lastKey] = current[lastKey].filter((id: number) => id !== moduleId);

    // Update in database
    const { error: updateError } = await supabase
      .from('faculty_hierarchy')
      .update({ data: updatedData, updated_at: new Date().toISOString() })
      .eq('id', currentData.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update hierarchy' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Module ${moduleId} removed successfully`,
      modules: current[lastKey]
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
