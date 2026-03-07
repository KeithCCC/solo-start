import { importContactsCsvAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

const SAMPLE_CSV = `name,email,phone,project,tags,notes
山田 太郎,taro@example.jp,09011112222,商談管理改善,hot|founder,紹介案件
Suzuki Hana,hana@example.jp,09033334444,PoC支援,warm,来月提案予定`;

export default async function ImportPage() {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const contacts = await repos.contacts.list(ownerId, { limit: 10 });

  return (
    <div>
      <h1 className="page-title">CSVインポート</h1>
      <div className="split">
        <section className="card">
          <h3>コンタクトCSV</h3>
          <p className="muted">ヘッダ対応: name,email,phone,project,tags,notes</p>
          <form action={importContactsCsvAction} className="list">
            <textarea name="csv" defaultValue={SAMPLE_CSV} />
            <button type="submit">インポート実行</button>
          </form>
        </section>

        <section className="card">
          <h3>最近のコンタクト</h3>
          <div className="list">
            {contacts.map((contact) => (
              <div key={contact.id} className="list-item">
                <strong>{contact.name}</strong>
                <div className="muted">{contact.email ?? "emailなし"}</div>
              </div>
            ))}
            {contacts.length === 0 && <div className="muted">まだデータがありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

