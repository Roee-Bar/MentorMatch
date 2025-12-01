import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const project = await ProjectService.getProjectById(params.id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

