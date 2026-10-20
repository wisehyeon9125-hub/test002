'use client';

import React, { useState } from 'react';
import { PostCategory, Profile } from '@/types/database';
import { X, Calendar, MapPin, Route, Gauge, Flame } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: {
    category: PostCategory;
    title: string;
    content: string;
    location?: string;
    run_date?: string;
    target_distance_km?: number;
    target_pace?: string;
  }) => Promise<void>;
  currentProfile: Profile | null;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  currentProfile,
}: CreatePostModalProps) {
  const [category, setCategory] = useState<PostCategory>('regular_run');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('여의도 한강공원 물빛광장');
  const [runDate, setRunDate] = useState('');
  const [distance, setDistance] = useState('7.0');
  const [pace, setPace] = useState('5:40/km');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentProfile?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        category,
        title,
        content,
        location: category === 'regular_run' ? location : undefined,
        run_date: category === 'regular_run' && runDate ? runDate : undefined,
        target_distance_km:
          category === 'regular_run' && distance ? parseFloat(distance) : undefined,
        target_pace: category === 'regular_run' ? pace : undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || '게시글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-track-800 border border-track-600 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-track-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-volt" />
            <h2 className="font-bold text-base text-track-100">새 러닝 / 게시글 작성</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-track-400 hover:text-track-100 hover:bg-track-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-track-300 mb-2">카테고리</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('regular_run')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  category === 'regular_run'
                    ? 'bg-volt text-track-950 border-volt font-bold'
                    : 'bg-track-900 border-track-600 text-track-300 hover:border-track-500'
                }`}
              >
                ⚡ 정기 러닝 번개
              </button>
              <button
                type="button"
                onClick={() => setCategory('course')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  category === 'course'
                    ? 'bg-volt text-track-950 border-volt font-bold'
                    : 'bg-track-900 border-track-600 text-track-300 hover:border-track-500'
                }`}
              >
                🗺️ 추천 코스
              </button>
              <button
                type="button"
                onClick={() => setCategory('gear')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  category === 'gear'
                    ? 'bg-volt text-track-950 border-volt font-bold'
                    : 'bg-track-900 border-track-600 text-track-300 hover:border-track-500'
                }`}
              >
                👟 러닝 기어/화
              </button>
              <button
                type="button"
                onClick={() => setCategory('free')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  category === 'free'
                    ? 'bg-volt text-track-950 border-volt font-bold'
                    : 'bg-track-900 border-track-600 text-track-300 hover:border-track-500'
                }`}
              >
                💬 자유 소통
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setCategory('notice')}
                  className={`col-span-2 sm:col-span-4 py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                    category === 'notice'
                      ? 'bg-red-500 text-white border-red-500 font-bold'
                      : 'bg-red-950/40 border-red-800 text-red-300 hover:border-red-700'
                  }`}
                >
                  📢 크루 전체 공지 (관리자 전용)
                </button>
              )}
            </div>
          </div>

          {/* Regular Run Extra Inputs */}
          {category === 'regular_run' && (
            <div className="p-4 rounded-xl bg-track-900 border border-track-600 space-y-3">
              <div className="text-xs font-bold text-volt flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>번개 러닝 상세 스펙</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-track-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-volt" /> 러닝 일시
                  </label>
                  <input
                    type="datetime-local"
                    value={runDate}
                    onChange={(e) => setRunDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-track-800 border border-track-600 text-track-100 text-xs focus:outline-none focus:border-volt"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-track-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-volt" /> 집결 장소
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="예: 여의도 한강공원 물빛광장 앞"
                    className="w-full px-3 py-1.5 rounded-lg bg-track-800 border border-track-600 text-track-100 text-xs focus:outline-none focus:border-volt"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-track-400 mb-1 flex items-center gap-1">
                    <Route className="w-3 h-3 text-volt" /> 목표 거리 (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="7.0"
                    className="w-full px-3 py-1.5 rounded-lg bg-track-800 border border-track-600 text-track-100 text-xs focus:outline-none focus:border-volt"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-track-400 mb-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-volt" /> 목표 페이스
                  </label>
                  <input
                    type="text"
                    value={pace}
                    onChange={(e) => setPace(e.target.value)}
                    placeholder="예: 5:40/km (초보 환영 6분 페이스)"
                    className="w-full px-3 py-1.5 rounded-lg bg-track-800 border border-track-600 text-track-100 text-xs focus:outline-none focus:border-volt"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-track-300 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'regular_run'
                  ? '예: [금요 나이트런] 여의도 한강 7K 가볍게 털기'
                  : '제목을 입력하세요'
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-track-900 border border-track-600 text-track-100 placeholder-track-500 focus:outline-none focus:border-volt text-sm"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-track-300 mb-1">내용</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="러닝 코스, 준비물, 코멘트 등을 자유롭게 공유해 주세요."
              className="w-full px-3.5 py-2.5 rounded-lg bg-track-900 border border-track-600 text-track-100 placeholder-track-500 focus:outline-none focus:border-volt text-sm resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-track-300 hover:text-track-100 hover:bg-track-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-volt text-track-950 hover:bg-volt-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? '등록 중...' : category === 'regular_run' ? '러닝 번개 열기' : '게시글 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
