import Link from "next/link";
import { createContactAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

interface ContactsPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const params = (await searchParams) ?? {};
  const keyword = (params.q ?? "").trim();

  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const contacts = await repos.contacts.list(ownerId, { keyword: keyword || undefined });
  const companies = await repos.companies.list(ownerId);

  return (
    <div>
      <h1 className="page-title">コンタクト</h1>
      <section className="card" style={{ marginBottom: 12 }}>
        <h3>検索</h3>
        <form method="get" className="row wrap">
          <input name="q" placeholder="名前・メール・電話・プロジェクトで検索" defaultValue={keyword} style={{ maxWidth: 420 }} />
          <button type="submit" className="secondary">
            検索
          </button>
        </form>
      </section>

      <div className="split">
        <section className="card">
          <h3>新規コンタクト</h3>
          <form action={createContactAction} className="list">
            <input name="name" placeholder="氏名" required />
            <select name="companyId" defaultValue="">
              <option value="">会社なし</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <input name="email" placeholder="email@example.com" />
            <input name="phone" placeholder="電話番号" />
            <input name="tags" placeholder="タグ (例: hot,founder)" />
            <input name="project" placeholder="プロジェクト" />
            <textarea name="notes" placeholder="メモ" />
            <button type="submit">保存</button>
          </form>
        </section>

        <section className="card">
          <h3>一覧</h3>
          <div className="list">
            {contacts.map((contact) => (
              <Link key={contact.id} href={`/contacts/${contact.id}`} className="list-item">
                <div className="row wrap">
                  <strong>{contact.name}</strong>
                  {contact.email && <span className="muted">{contact.email}</span>}
                  {contact.tags.length > 0 && <span className="badge">{contact.tags.join(", ")}</span>}
                </div>
              </Link>
            ))}
            {contacts.length === 0 && <div className="muted">該当するコンタクトがありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

