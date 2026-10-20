'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Profile } from '@/types/database';
import { Flame, Shield, LogOut, Plus, ChevronRight, UserCheck, AlertCircle } from 'lucide-react';

interface NavbarProps {
  profile: Profile | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenCreateModal: () => void;
  pendingCount?: number;
}

export function Navbar({
  profile,
  onLogin,
  onLogout,
  onOpenCreateModal,
  pendingCount = 0,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-track-600 bg-track-900/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-volt flex items-center justify-center text-track-950 font-black text-lg tracking-tight group-hover:scale-105 transition-transform">
            P
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-track-100 flex items-center gap-2">
              PACE & STRIDE
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-track-700 text-track-400 border border-track-600">
                SEOUL CREW
              </span>
            </div>
            <div className="text-[11px] text-track-400 hidden sm:block">도심 나이트런 & 주말 트랙 커뮤니티</div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {profile ? (
            <>
              {/* Admin Button */}
              {profile.role === 'admin' && (
                <Link
                  href="/admin"
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-track-200 bg-track-800 hover:bg-track-700 border border-track-600 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-volt" />
                  <span>크루원 관리</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-volt text-track-950 text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Status Badge */}
              {profile.status === 'pending' && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>승인 대기 중</span>
                </div>
              )}

              {/* Write Post Button (Approved only) */}
              {profile.status === 'approved' && (
                <button
                  onClick={onOpenCreateModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-volt text-track-950 hover:bg-volt-hover transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">러닝 / 글 작성</span>
                  <span className="sm:hidden">작성</span>
                </button>
              )}

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-track-600 hover:border-track-500 bg-track-800 transition-colors"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Profile'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-track-700 text-track-300 text-xs font-bold flex items-center justify-center">
                      {(profile.full_name || profile.email)[0].toUpperCase()}
                    </div>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-track-800 border border-track-600 shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-track-700">
                      <div className="font-semibold text-track-100 truncate">
                        {profile.full_name || '러너'}
                      </div>
                      <div className="text-track-400 truncate">{profile.email}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-track-400">
                          {profile.pace || '6:00/km'}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            profile.status === 'approved'
                              ? 'bg-track-700 text-track-200'
                              : 'bg-amber-900/40 text-amber-300'
                          }`}
                        >
                          {profile.status === 'approved' ? '승인 크루원' : '승인 대기'}
                        </span>
                      </div>
                    </div>

                    {profile.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-track-200 hover:bg-track-700 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-volt" />
                        <span>관리자 페이지</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-track-700 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-track-800 hover:bg-track-700 text-track-100 border border-track-600 transition-all shadow-sm"
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
              <span>Google 로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
