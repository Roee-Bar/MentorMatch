import { NextRequest, NextResponse } from 'next/server';
import { AdminService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (authResult.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const stats = await AdminService.getDashboardStats();
    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

