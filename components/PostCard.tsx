'use client';

import React from 'react';
import { Post, Profile } from '@/types/database';
import {
  MapPin,
  Calendar,
  Gauge,
  Route,
  Heart,
  MessageSquare,
  Users,
  Trash2,
  Check,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentProfile: Profile | null;
  onOpenDetail: (post: Post) => void;
  onToggleLike: (postId: string) => void;
  onToggleAttend: (postId: string) => void;
  onDeletePost: (postId: string) => void;
}

export function PostCard({
  post,
  currentProfile,
  onOpenDetail,
  onToggleLike,
  onToggleAttend,
  onDeletePost,
}: PostCardProps) {
  const isAuthor = currentProfile?.id === post.author_id;
  const isAdmin = currentProfile?.role === 'admin';
  const canDelete = isAuthor || isAdmin;
  const isApproved = currentProfile?.status === 'approved';

  const categoryMeta = {
    notice: { label: '공지사항', bg: 'bg-red-950/60 text-red-300 border-red-800' },
    regular_run: { label: '정기 러닝 번개', bg: 'bg-volt/10 text-volt border-volt/30' },
    course: { label: '추천 코스', bg: 'bg-blue-950/60 text-blue-300 border-blue-800' },
    gear: { label: '러닝 기어/화', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
    free: { label: '자유 소통', bg: 'bg-track-700 text-track-300 border-track-600' },
  }[post.category] || { label: '일반', bg: 'bg-track-700 text-track-300 border-track-600' };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return `${d.getMonth() + 1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateString;
    }
  };

  return (
    <article className="rounded-xl border border-track-600 bg-track-800 hover:border-track-500 transition-all overflow-hidden flex flex-col justify-between">
      <div className="p-5">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${categoryMeta.bg}`}>
              {categoryMeta.label}
            </span>
            <span className="text-xs text-track-400">
              {new Date(post.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('이 게시글을 삭제하시겠습니까?')) {
                  onDeletePost(post.id);
                }
              }}
              className="p-1 rounded text-track-400 hover:text-red-400 hover:bg-track-700 transition-colors"
              title="게시글 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetail(post)}
          className="font-bold text-base sm:text-lg text-track-100 hover:text-volt cursor-pointer transition-colors mb-2 line-clamp-2"
        >
          {post.title}
        </h3>

        {/* Content Snippet */}
        <p
          onClick={() => onOpenDetail(post)}
          className="text-xs sm:text-sm text-track-300 cursor-pointer line-clamp-3 mb-4 leading-relaxed"
        >
          {post.content}
        </p>

        {/* Regular Run Details Box */}
        {post.category === 'regular_run' && (
          <div className="mb-4 p-3 rounded-lg bg-track-900 border border-track-700/80 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-track-300">
              {post.run_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-volt" />
                  <span className="font-medium text-track-200">{formatDate(post.run_date)}</span>
                </div>
              )}
              {post.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-volt" />
                  <span className="truncate">{post.location}</span>
                </div>
              )}
              {post.target_distance_km && (
                <div className="flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-volt" />
                  <span className="font-mono text-track-100">{post.target_distance_km} km</span>
                </div>
              )}
              {post.target_pace && (
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-volt" />
                  <span className="font-mono text-track-100">{post.target_pace}</span>
                </div>
              )}
            </div>

            {/* Attendees section */}
            <div className="pt-2 border-t border-track-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-track-400" />
                <span className="text-[11px] text-track-400">
                  참석 {post.attendees?.length || 0}명
                </span>
                {/* Avatars */}
                <div className="flex -space-x-1.5 overflow-hidden">
                  {post.attendees?.slice(0, 4).map((att, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-track-800 bg-track-700 text-[9px] font-bold text-track-200 flex items-center justify-center overflow-hidden"
                      title={att.profile?.full_name || '러너'}
                    >
                      {att.profile?.avatar_url ? (
                        <img src={att.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (att.profile?.full_name || 'R')[0].toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Join / Leave Button */}
              {isApproved && (
                <button
                  onClick={() => onToggleAttend(post.id)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    post.is_joined_by_me
                      ? 'bg-track-700 text-track-200 hover:bg-track-600 border border-track-600'
                      : 'bg-volt text-track-950 hover:bg-volt-hover font-bold shadow-sm'
                  }`}
                >
                  {post.is_joined_by_me ? (
                    <>
                      <Check className="w-3 h-3 text-volt" />
                      참석 완료
                    </>
                  ) : (
                    '참석 신청'
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Author & Social */}
      <div className="px-5 py-3 border-t border-track-700 bg-track-900/40 flex items-center justify-between text-xs text-track-400">
        {/* Author info */}
        <div className="flex items-center gap-2">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-track-600"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-track-700 text-[10px] text-track-200 font-bold flex items-center justify-center">
              {(post.author?.full_name || 'R')[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium text-track-200 truncate max-w-[120px]">
            {post.author?.full_name || '크루원'}
          </span>
          {post.author?.pace && (
            <span className="font-mono text-[10px] text-track-400">
              {post.author.pace}
            </span>
          )}
        </div>

        {/* Actions: Likes & Comments */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleLike(post.id)}
            disabled={!isApproved}
            className={`flex items-center gap-1 transition-colors ${
              post.is_liked_by_me ? 'text-red-400' : 'hover:text-track-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${post.is_liked_by_me ? 'fill-current' : ''}`} />
            <span>{post.likes_count}</span>
          </button>

          <button
            onClick={() => onOpenDetail(post)}
            className="flex items-center gap-1 hover:text-track-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{post.comments_count}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
