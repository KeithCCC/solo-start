import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealFlow Lite Local",
  description: "Local-first CRM MVP demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="logo">DealFlow Lite</div>
            <nav className="nav">
              <Link href="/">ダッシュボード</Link>
              <Link href="/contacts">コンタクト</Link>
              <Link href="/companies">会社</Link>
              <Link href="/deals">パイプライン</Link>
              <Link href="/tasks">タスク</Link>
              <Link href="/import">CSVインポート</Link>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}

