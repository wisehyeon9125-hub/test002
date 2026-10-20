'use client';

import React, { useState, useEffect } from 'react';
import { Post, Comment, Profile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { X, Send, Trash2, Calendar, MapPin, Route, Gauge, Heart, Users } from 'lucide-react';

interface PostDetailModalProps {
  post: Post | null;
  currentProfile: Profile | null;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onToggleAttend: (postId: string) => void;
  onCommentCountChange?: (postId: string, newCount: number) => void;
}

export function PostDetailModal({
  post,
  currentProfile,
  onClose,
  onToggleLike,
  onToggleAttend,
  onCommentCountChange,
}: PostDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!post) return;
    loadComments();
  }, [post?.id]);

  if (!post) return null;

  const isApproved = currentProfile?.status === 'approved';
  const isAdmin = currentProfile?.role === 'admin';

  const loadComments = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as Comment[]);
    }
    setLoading(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentProfile || !isApproved) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        author_id: currentProfile.id,
        content: newComment.trim(),
      })
      .select('*, author:profiles(*)')
      .single();

    if (!error && data) {
      const updated = [...comments, data as Comment];
      setComments(updated);
      setNewComment('');
      onCommentCountChange?.(post.id, updated.length);
    } else if (error) {
      alert(error.message || '댓글 등록에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      onCommentCountChange?.(post.id, updated.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-track-800 border border-track-600 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-track-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-semibold bg-track-700 text-track-200 border border-track-600">
              {post.category.toUpperCase()}
            </span>
            <span className="text-xs text-track-400">
              {new Date(post.created_at).toLocaleString('ko-KR')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-track-400 hover:text-track-100 hover:bg-track-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title & Author */}
          <div>
            <h2 className="text-xl font-bold text-track-100 mb-3 leading-snug">
              {post.title}
            </h2>
            <div className="flex items-center gap-3">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-track-600"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-track-700 text-xs font-bold flex items-center justify-center text-track-200">
                  {(post.author?.full_name || 'R')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-track-100">
                  {post.author?.full_name || '러너'}
                </div>
                <div className="text-[11px] text-track-400 flex items-center gap-2 font-mono">
                  <span>{post.author?.pace || '6:00/km'}</span>
                  <span>·</span>
                  <span>{post.author?.bio || 'Pace & Stride Crew'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regular Run Details */}
          {post.category === 'regular_run' && (
            <div className="p-4 rounded-xl bg-track-900 border border-track-600 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {post.run_date && (
                  <div className="flex items-center gap-2 text-track-300">
                    <Calendar className="w-4 h-4 text-volt" />
                    <span>{new Date(post.run_date).toLocaleString('ko-KR')}</span>
                  </div>
                )}
                {post.location && (
                  <div className="flex items-center gap-2 text-track-300">
                    <MapPin className="w-4 h-4 text-volt" />
                    <span>{post.location}</span>
                  </div>
                )}
                {post.target_distance_km && (
                  <div className="flex items-center gap-2 text-track-300">
                    <Route className="w-4 h-4 text-volt" />
                    <span className="font-mono text-track-100">{post.target_distance_km} km</span>
                  </div>
                )}
                {post.target_pace && (
                  <div className="flex items-center gap-2 text-track-300">
                    <Gauge className="w-4 h-4 text-volt" />
                    <span className="font-mono text-track-100">{post.target_pace}</span>
                  </div>
                )}
              </div>

              {/* Attendance Bar */}
              <div className="pt-3 border-t border-track-700 flex items-center justify-between">
                <div className="text-xs text-track-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-track-400" />
                  <span>참석 크루원 ({post.attendees?.length || 0}명)</span>
                </div>
                {isApproved && (
                  <button
                    onClick={() => onToggleAttend(post.id)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      post.is_joined_by_me
                        ? 'bg-track-700 text-track-200 border border-track-600'
                        : 'bg-volt text-track-950 hover:bg-volt-hover font-bold shadow-sm'
                    }`}
                  >
                    {post.is_joined_by_me ? '참석 취소' : '참석하기'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="text-sm text-track-200 leading-relaxed whitespace-pre-wrap py-2 border-y border-track-700/60">
            {post.content}
          </div>

          {/* Social Stats */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onToggleLike(post.id)}
              disabled={!isApproved}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                post.is_liked_by_me
                  ? 'border-red-900 bg-red-950/40 text-red-400'
                  : 'border-track-600 bg-track-900 text-track-300 hover:text-track-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.is_liked_by_me ? 'fill-current' : ''}`} />
              <span>좋아요 {post.likes_count}</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-track-700">
            <h4 className="text-xs font-bold text-track-300 mb-3">
              댓글 {comments.length}개
            </h4>

            {/* Comment List */}
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-track-500">
                  첫 댓글을 남겨보세요.
                </div>
              ) : (
                comments.map((comment) => {
                  const canDelete =
                    currentProfile?.id === comment.author_id || isAdmin;
                  return (
                    <div
                      key={comment.id}
                      className="p-3 rounded-lg bg-track-900 border border-track-700/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        {comment.author?.avatar_url ? (
                          <img
                            src={comment.author.avatar_url}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover border border-track-600 mt-0.5"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-track-700 text-[10px] font-bold text-track-300 flex items-center justify-center mt-0.5">
                            {(comment.author?.full_name || 'R')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-track-200">
                              {comment.author?.full_name || '크루원'}
                            </span>
                            <span className="text-[10px] text-track-500">
                              {new Date(comment.created_at).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-track-300 mt-1 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-track-500 hover:text-red-400 transition-colors"
                          title="댓글 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Input */}
            {isApproved ? (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="따뜻한 응원이나 질문을 남겨보세요."
                  className="flex-1 px-3.5 py-2 rounded-lg bg-track-900 border border-track-600 text-track-100 placeholder-track-500 text-xs focus:outline-none focus:border-volt"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 rounded-lg bg-volt text-track-950 font-bold hover:bg-volt-hover transition-colors text-xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>등록</span>
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-lg bg-track-900 border border-track-700/60 text-center text-xs text-track-400">
                {currentProfile
                  ? '관리자의 크루원 승인 후 댓글 작성이 가능합니다.'
                  : '구글 로그인 후 승인된 크루원만 댓글 작성이 가능합니다.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
