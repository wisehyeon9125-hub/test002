import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

// DELETE: 관리자가 부적절한 게시글 삭제
export async function DELETE(request: Request) {
  const { isAdmin, error } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('id');

  if (!postId) {
    return NextResponse.json({ error: '게시글 ID가 필요합니다.' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient
    .from('posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
