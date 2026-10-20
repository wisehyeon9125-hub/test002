'use client';

import React, { useState, useEffect } from 'react';
import { Post, Profile, PostCategory } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/Navbar';
import { PostCard } from '@/components/PostCard';
import { CreatePostModal } from '@/components/CreatePostModal';
import { PostDetailModal } from '@/components/PostDetailModal';
import {
  Flame,
  Zap,
  MapPin,
  Calendar,
  Compass,
  Plus,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function HomePage() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuthAndData();
  }, []);

  const initAuthAndData = async () => {
    setLoading(true);
    const supabase = createClient();

    // 1. Check Session & Profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchMyProfile(session.user.id);
    }

    // 2. Fetch Posts
    await loadPosts(session?.user?.id);

    // 3. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession?.user) {
          await fetchMyProfile(newSession.user.id);
        } else {
          setCurrentProfile(null);
        }
        await loadPosts(newSession?.user?.id);
      }
    );

    setLoading(false);
    return () => subscription.unsubscribe();
  };

  const fetchMyProfile = async (userId: string) => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      setCurrentProfile(profile as Profile);

      // If admin, count pending members
      if (profile.role === 'admin') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingCount(count || 0);
      }
    }
  };

  const loadPosts = async (currentUserId?: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(*),
        post_likes(user_id),
        run_attendees(user_id, profile:profiles(*))
      `)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formatted: Post[] = data.map((item: any) => ({
        ...item,
        is_liked_by_me: currentUserId
          ? item.post_likes?.some((l: any) => l.user_id === currentUserId)
          : false,
        is_joined_by_me: currentUserId
          ? item.run_attendees?.some((a: any) => a.user_id === currentUserId)
          : false,
        attendees: item.run_attendees || [],
      }));
      setPosts(formatted);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      // In case Google OAuth is not configured on Supabase dashboard yet, offer email/demo login
      alert(`Google 로그인 요청 중 안내: ${error.message}\n(Supabase 대시보드에서 Google Provider Client ID/Secret 설정이 필요할 수 있습니다.)`);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentProfile(null);
  };

  // Toggle Like
  const handleToggleLike = async (postId: string) => {
    if (!currentProfile) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    if (currentProfile.status !== 'approved') {
      alert('관리자의 크루원 승인 후 좋아요 및 참여가 가능합니다.');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const supabase = createClient();
    const isLiked = post.is_liked_by_me;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked_by_me: !isLiked,
              likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .match({ post_id: postId, user_id: currentProfile.id });
      await supabase
        .from('posts')
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq('id', postId);
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: currentProfile.id });
      await supabase
        .from('posts')
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', postId);
    }
  };

  // Toggle Attend (정기 러닝 참석 토글)
  const handleToggleAttend = async (postId: string) => {
    if (!currentProfile) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    if (currentProfile.status !== 'approved') {
      alert('관리자의 크루원 승인 후 러닝 참석 신청이 가능합니다.');
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const supabase = createClient();
    const isJoined = post.is_joined_by_me;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const attendees = isJoined
          ? p.attendees?.filter((a) => a.user_id !== currentProfile.id) || []
          : [...(p.attendees || []), { user_id: currentProfile.id, profile: currentProfile }];
        return {
          ...p,
          is_joined_by_me: !isJoined,
          attendees,
        };
      })
    );

    if (isJoined) {
      await supabase
        .from('run_attendees')
        .delete()
        .match({ post_id: postId, user_id: currentProfile.id });
    } else {
      await supabase
        .from('run_attendees')
        .insert({ post_id: postId, user_id: currentProfile.id });
    }
  };

  // Create Post
  const handleCreatePost = async (postData: {
    category: PostCategory;
    title: string;
    content: string;
    location?: string;
    run_date?: string;
    target_distance_km?: number;
    target_pace?: string;
  }) => {
    if (!currentProfile || currentProfile.status !== 'approved') {
      throw new Error('승인된 크루원만 글 작성이 가능합니다.');
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: currentProfile.id,
        category: postData.category,
        title: postData.title,
        content: postData.content,
        location: postData.location || null,
        run_date: postData.run_date ? new Date(postData.run_date).toISOString() : null,
        target_distance_km: postData.target_distance_km || null,
        target_pace: postData.target_pace || null,
      })
      .select('*, author:profiles(*)')
      .single();

    if (error) throw error;

    if (data) {
      setPosts([
        {
          ...data,
          likes_count: 0,
          comments_count: 0,
          is_liked_by_me: false,
          is_joined_by_me: false,
          attendees: [],
        },
        ...posts,
      ]);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    } else {
      alert(error.message || '게시글 삭제에 실패했습니다.');
    }
  };

  // Filtered posts
  const filteredPosts = posts.filter((p) =>
    selectedCategory === 'all' ? true : p.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-track-900 text-track-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        profile={currentProfile}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Subject-Grounding Hero Banner (Clean, Athletic, Anti-AI-Slop) */}
        <section className="relative rounded-2xl border border-track-600 bg-track-800 p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-volt/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-track-900 border border-track-600 text-xs font-mono text-track-300">
                <span className="w-2 h-2 rounded-full bg-volt animate-pulse" />
                <span>CITY NIGHT & TRACK RUNNERS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-track-100 uppercase">
                우리는 속도가 아닌, <br className="hidden sm:inline" />
                <span className="text-volt">함께 달리는 호흡</span>으로 연결됩니다.
              </h1>
              <p className="text-xs sm:text-sm text-track-400 leading-relaxed">
                도심 속 정기 번개 러닝, 추천 코스 및 러닝화 기어 정보를 공유하는 크루 프라이빗 게시판입니다.
                구글 로그인 후 운영진 승인을 거쳐 정식 크루원으로 활동할 수 있습니다.
              </p>
            </div>

            {/* Status / Quick Action Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-track-900/90 border border-track-700/80 w-full md:w-80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-track-300">내 크루 활동 상태</span>
                {currentProfile ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentProfile.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {currentProfile.status === 'approved' ? '승인 크루원' : '승인 대기'}
                  </span>
                ) : (
                  <span className="text-track-500 text-[10px]">미로그인</span>
                )}
              </div>

              {currentProfile ? (
                <div className="space-y-2 pt-1 border-t border-track-700">
                  <div className="flex justify-between text-track-400">
                    <span>러너</span>
                    <span className="font-bold text-track-100">{currentProfile.full_name}</span>
                  </div>
                  <div className="flex justify-between text-track-400">
                    <span>목표 페이스</span>
                    <span className="font-mono text-volt">{currentProfile.pace || '6:00/km'}</span>
                  </div>
                  {currentProfile.status === 'pending' && (
                    <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-800 text-[11px] text-amber-300 flex items-start gap-1.5 leading-tight">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>운영진의 승인 후 게시글 작성 및 참석 신청이 활성화됩니다.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 pt-1 border-t border-track-700">
                  <p className="text-track-400 text-[11px] leading-relaxed">
                    구글 계정으로 가입 신청을 완료하면 운영진이 승인 후 게시판 이용 권한을 부여합니다.
                  </p>
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-2 px-3 rounded-lg bg-track-800 hover:bg-track-700 border border-track-600 text-track-100 font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google 로그인으로 신청</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Categories Bar & Quick Write Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-track-600 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {[
              { id: 'all', label: '전체 피드' },
              { id: 'regular_run', label: '⚡ 정기 러닝 번개' },
              { id: 'course', label: '🗺️ 추천 코스' },
              { id: 'gear', label: '👟 러닝 기어' },
              { id: 'free', label: '💬 자유 소통' },
              { id: 'notice', label: '📢 공지사항' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-track-700 text-volt border border-track-600 shadow-sm'
                    : 'text-track-400 hover:text-track-200 hover:bg-track-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {currentProfile?.status === 'approved' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="self-end sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-volt text-track-950 font-bold hover:bg-volt-hover transition-colors text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>새 글 / 러닝 번개</span>
            </button>
          )}
        </div>

        {/* Post Grid */}
        {filteredPosts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-track-700 bg-track-800/40 p-8 space-y-3">
            <Compass className="w-8 h-8 text-track-500 mx-auto" />
            <h3 className="font-bold text-sm text-track-300">아직 등록된 게시글이 없습니다.</h3>
            <p className="text-xs text-track-500 max-w-sm mx-auto">
              첫 번째 러닝 번개를 열거나 도심 코스를 크루원들에게 추천해 보세요!
            </p>
            {currentProfile?.status === 'approved' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 px-4 py-1.5 rounded-md bg-volt text-track-950 font-bold text-xs"
              >
                첫 게시글 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentProfile={currentProfile}
                onOpenDetail={(p) => setSelectedPost(p)}
                onToggleLike={handleToggleLike}
                onToggleAttend={handleToggleAttend}
                onDeletePost={handleDeletePost}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-track-600 bg-track-950 py-8 text-center text-xs text-track-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-volt" />
            <span className="font-bold text-track-300">PACE & STRIDE RUNNING CLUB</span>
          </div>
          <div>서울 도심 러너들을 위한 프라이빗 소셜 보드</div>
        </div>
      </footer>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        currentProfile={currentProfile}
      />

      <PostDetailModal
        post={selectedPost}
        currentProfile={currentProfile}
        onClose={() => setSelectedPost(null)}
        onToggleLike={handleToggleLike}
        onToggleAttend={handleToggleAttend}
        onCommentCountChange={(postId, newCount) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments_count: newCount } : p))
          );
        }}
      />
    </div>
  );
}
