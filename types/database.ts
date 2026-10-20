export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  pace: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type PostCategory = 'notice' | 'regular_run' | 'course' | 'free' | 'gear';

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  title: string;
  content: string;
  location: string | null;
  run_date: string | null;
  target_distance_km: number | null;
  target_pace: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
  is_liked_by_me?: boolean;
  is_joined_by_me?: boolean;
  attendees?: { user_id: string; profile?: Profile }[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}
