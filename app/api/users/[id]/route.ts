import { NextRequest, NextResponse } from 'next/server';
import { AdminUserService } from '@/lib/services/admin-services';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const isOwner = authResult.user?.uid === params.id;
    const isAdmin = authResult.user?.role === 'admin';
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const user = await AdminUserService.getUserById(params.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const isOwner = authResult.user?.uid === params.id;
    const isAdmin = authResult.user?.role === 'admin';
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: true, message: 'User updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

