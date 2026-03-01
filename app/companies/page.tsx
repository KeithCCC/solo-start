import { createCompanyAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const companies = await repos.companies.list(ownerId);

  return (
    <div>
      <h1 className="page-title">会社</h1>
      <div className="split">
        <section className="card">
          <h3>新規会社</h3>
          <form action={createCompanyAction} className="list">
            <input name="name" placeholder="会社名" required />
            <input name="industry" placeholder="業界" />
            <textarea name="notes" placeholder="メモ" />
            <button type="submit">保存</button>
          </form>
        </section>
        <section className="card">
          <h3>会社一覧</h3>
          <div className="list">
            {companies.map((c) => (
              <div key={c.id} className="list-item">
                <strong>{c.name}</strong>
                <div className="muted">{c.industry ?? "業界未設定"}</div>
              </div>
            ))}
            {companies.length === 0 && <div className="muted">会社がありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

