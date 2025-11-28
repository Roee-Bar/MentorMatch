import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/firebase-services';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const projects = await ProjectService.getAllProjects();
    return NextResponse.json({ success: true, data: projects, count: projects.length }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (authResult.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const projectId = await ProjectService.createProject(body);
    return NextResponse.json({ success: true, data: { projectId } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

