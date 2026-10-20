'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Profile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  UserX,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert('로그인이 필요한 페이지입니다.');
      router.push('/');
      return;
    }

    // Get current profile
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!myProfile || myProfile.role !== 'admin' || myProfile.status !== 'approved') {
      alert('관리자 권한이 없습니다.');
      router.push('/');
      return;
    }

    setCurrentProfile(myProfile);

    // Load all users via API
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.profiles) {
        setUsers(data.profiles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { status?: 'approved' | 'rejected' | 'pending'; role?: 'admin' | 'member' }
  ) => {
    setActionLoadingId(userId);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      });

      const data = await res.json();
      if (res.ok && data.profile) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...data.profile } : u))
        );
      } else {
        alert(data.error || '권한 변경 실패');
      }
    } catch (err: any) {
      alert(err.message || '네트워크 오류');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    const matchesSearch =
      (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-track-900 flex items-center justify-center text-track-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-volt border-t-transparent animate-spin" />
          <span className="text-sm font-medium">관리자 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-track-900 text-track-100">
      {/* Top Header */}
      <header className="border-b border-track-600 bg-track-800/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg border border-track-600 bg-track-900 text-track-400 hover:text-track-100 hover:border-track-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-volt" />
              <h1 className="font-bold text-base text-track-100">
                크루원 승인 및 권한 관리
              </h1>
            </div>
          </div>
          <div className="text-xs text-track-400 font-mono">
            관리자: <span className="text-volt font-bold">{currentProfile?.full_name}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-track-600 bg-track-800">
            <div className="text-xs text-track-400 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>승인 대기</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">
              {pendingCount}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-track-600 bg-track-800">
            <div className="text-xs text-track-400 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-volt" />
              <span>승인된 크루원</span>
            </div>
            <div className="text-2xl font-bold font-mono text-track-100">
              {approvedCount}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-track-600 bg-track-800">
            <div className="text-xs text-track-400 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>운영진(관리자)</span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-300">
              {adminCount}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-track-600 bg-track-800">
            <div className="text-xs text-track-400 mb-1">전체 신청자</div>
            <div className="text-2xl font-bold font-mono text-track-300">
              {users.length}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-xl border border-track-600 bg-track-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-track-900 p-1 rounded-lg border border-track-700">
            {[
              { id: 'all', label: '전체' },
              { id: 'pending', label: `대기 (${pendingCount})` },
              { id: 'approved', label: '승인됨' },
              { id: 'rejected', label: '거절됨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterStatus === tab.id
                    ? 'bg-track-700 text-track-100 font-bold shadow-sm'
                    : 'text-track-400 hover:text-track-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-track-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-track-900 border border-track-700 text-track-100 placeholder-track-500 focus:outline-none focus:border-volt"
            />
          </div>
        </div>

        {/* Users List / Table */}
        <div className="rounded-xl border border-track-600 bg-track-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-track-900/60 text-track-400 border-b border-track-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">러너 정보</th>
                  <th className="px-5 py-3 font-semibold">페이스 / 소개</th>
                  <th className="px-5 py-3 font-semibold">상태</th>
                  <th className="px-5 py-3 font-semibold">역할</th>
                  <th className="px-5 py-3 font-semibold">가입일</th>
                  <th className="px-5 py-3 font-semibold text-right">권한 관리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-track-700/60 text-track-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-track-500">
                      해당 조건의 크루원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentProfile?.id;
                    const isProcessing = actionLoadingId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-track-700/30 transition-colors">
                        {/* Runner info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-track-600"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-track-700 font-bold text-track-300 flex items-center justify-center">
                                {(user.full_name || user.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-track-100 flex items-center gap-1.5">
                                {user.full_name || '이름 없음'}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-track-700 text-track-400 text-[10px]">
                                    나
                                  </span>
                                )}
                              </div>
                              <div className="text-track-400 text-[11px] font-mono">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Pace & Bio */}
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-volt font-medium">
                            {user.pace || '6:00/km'}
                          </div>
                          <div className="text-track-400 text-[11px] truncate max-w-[200px]">
                            {user.bio || '-'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              user.status === 'approved'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                                : user.status === 'pending'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-red-950/60 text-red-300 border border-red-800'
                            }`}
                          >
                            {user.status === 'approved'
                              ? '승인됨 (활동 가능)'
                              : user.status === 'pending'
                              ? '승인 대기'
                              : '거절됨'}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              user.role === 'admin'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-track-900 text-track-400 border border-track-700'
                            }`}
                          >
                            {user.role === 'admin' ? '운영진 (Admin)' : '일반 크루원'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 text-track-400 font-mono text-[11px]">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-3.5 text-right">
                          {isSelf ? (
                            <span className="text-track-500 text-[11px]">본인 계정</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Pending actions */}
                              {user.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateUser(user.id, { status: 'approved' })
                                    }
                                    disabled={isProcessing}
                                    className="px-2.5 py-1 rounded bg-volt text-track-950 hover:bg-volt-hover font-bold transition-colors disabled:opacity-50"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateUser(user.id, { status: 'rejected' })
                                    }
                                    disabled={isProcessing}
                                    className="px-2.5 py-1 rounded bg-track-700 text-red-300 hover:bg-red-950/60 border border-track-600 transition-colors disabled:opacity-50"
                                  >
                                    거절
                                  </button>
                                </>
                              )}

                              {/* Approved actions */}
                              {user.status === 'approved' && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateUser(user.id, {
                                        role: user.role === 'admin' ? 'member' : 'admin',
                                      })
                                    }
                                    disabled={isProcessing}
                                    className="px-2.5 py-1 rounded bg-track-700 hover:bg-track-600 text-track-200 border border-track-600 transition-colors disabled:opacity-50"
                                    title="운영진 권한 토글"
                                  >
                                    {user.role === 'admin' ? '운영진 해제' : '운영진 지정'}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateUser(user.id, { status: 'rejected' })
                                    }
                                    disabled={isProcessing}
                                    className="px-2 py-1 rounded text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-50"
                                    title="승인 취소"
                                  >
                                    자격 취소
                                  </button>
                                </>
                              )}

                              {/* Rejected actions */}
                              {user.status === 'rejected' && (
                                <button
                                  onClick={() =>
                                    handleUpdateUser(user.id, { status: 'approved' })
                                  }
                                  disabled={isProcessing}
                                  className="px-2.5 py-1 rounded bg-volt text-track-950 hover:bg-volt-hover font-bold transition-colors disabled:opacity-50"
                                >
                                  재승인
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
