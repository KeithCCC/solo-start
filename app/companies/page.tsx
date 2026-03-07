import { createCompanyAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

interface CompaniesPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = (await searchParams) ?? {};
  const keyword = (params.q ?? "").trim();

  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const companies = await repos.companies.list(ownerId, { keyword: keyword || undefined });

  return (
    <div>
      <h1 className="page-title">会社</h1>
      <section className="card" style={{ marginBottom: 12 }}>
        <h3>検索</h3>
        <form method="get" className="row wrap">
          <input name="q" placeholder="会社名・業界・メモで検索" defaultValue={keyword} style={{ maxWidth: 420 }} />
          <button type="submit" className="secondary">
            検索
          </button>
        </form>
      </section>

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
            {companies.map((company) => (
              <div key={company.id} className="list-item">
                <strong>{company.name}</strong>
                <div className="muted">{company.industry ?? "業界未設定"}</div>
              </div>
            ))}
            {companies.length === 0 && <div className="muted">該当する会社がありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

