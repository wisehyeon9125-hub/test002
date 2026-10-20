import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PACE & STRIDE | 도심 러닝 크루 커뮤니티',
  description: '함께 달리고 코스를 나누는 프리미엄 도심 러닝 크루 게시판',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-track-900 text-track-100 selection:bg-volt selection:text-track-950">
        {children}
      </body>
    </html>
  );
}
