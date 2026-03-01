import Link from "next/link";
import { createContactAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const contacts = await repos.contacts.list(ownerId);
  const companies = await repos.companies.list(ownerId);

  return (
    <div>
      <h1 className="page-title">コンタクト</h1>
      <div className="split">
        <section className="card">
          <h3>新規コンタクト</h3>
          <form action={createContactAction} className="list">
            <input name="name" placeholder="氏名" required />
            <select name="companyId" defaultValue="">
              <option value="">会社なし</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
            {contacts.map((c) => (
              <Link key={c.id} href={`/contacts/${c.id}`} className="list-item">
                <div className="row wrap">
                  <strong>{c.name}</strong>
                  {c.email && <span className="muted">{c.email}</span>}
                  {c.tags.length > 0 && <span className="badge">{c.tags.join(", ")}</span>}
                </div>
              </Link>
            ))}
            {contacts.length === 0 && <div className="muted">コンタクトがありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

