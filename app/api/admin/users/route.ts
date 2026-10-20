import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Helper to check if requester is admin
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: '인증 헤더가 없습니다.' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { isAdmin: false, error: '유효하지 않은 세션입니다.' };
  }

  // Check role in profiles
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
    return { isAdmin: false, error: '관리자 권한이 없습니다.' };
  }

  return { isAdmin: true, user };
}

// GET: 관리자용 전체 유저 조회
export async function GET(request: Request) {
  const { isAdmin, error } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const { data: profiles, error: dbError } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ profiles });
}

// PATCH: 크루원 승인/거절 및 권한 업데이트
export async function PATCH(request: Request) {
  const { isAdmin, error } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  try {
    const { userId, status, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '유저 ID가 필요합니다.' }, { status: 400 });
    }

    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (status) updates.status = status;
    if (role) updates.role = role;

    const adminClient = createAdminClient();
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
  }
}
