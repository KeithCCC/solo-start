import { createActivityAction, sendMockEmailAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();

  const contact = await repos.contacts.findById(ownerId, id);
  if (!contact) {
    return (
      <div>
        <h1 className="page-title">コンタクト詳細</h1>
        <div className="card danger">対象コンタクトが見つかりません。</div>
      </div>
    );
  }

  await repos.email.seedDefaultTemplates(ownerId);
  const templates = await repos.email.listTemplates(ownerId);
  const activities = await repos.activities.listByContact(ownerId, id);

  return (
    <div>
      <h1 className="page-title">コンタクト詳細</h1>
      <div className="split">
        <section className="card">
          <h3>{contact.name}</h3>
          <p className="muted">{contact.email ?? "email未登録"}</p>
          <p className="muted">{contact.phone ?? "電話未登録"}</p>
          <p>{contact.notes ?? "メモなし"}</p>

          <h4>活動メモ追加</h4>
          <form action={createActivityAction} className="list">
            <input type="hidden" name="contactId" value={contact.id} />
            <textarea name="content" placeholder="商談メモなど" required />
            <button type="submit">保存</button>
          </form>

          <h4>Mockメール送信</h4>
          <form action={sendMockEmailAction} className="list">
            <input type="hidden" name="contactId" value={contact.id} />
            <select name="templateId" defaultValue="">
              <option value="">テンプレートなし</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <input name="subject" placeholder="件名" required />
            <textarea name="body" placeholder="本文" required />
            <button type="submit">送信ログを保存</button>
          </form>
        </section>

        <section className="card">
          <h3>活動履歴</h3>
          <div className="list">
            {activities.map((activity) => (
              <div key={activity.id} className="list-item">
                <div className="row wrap">
                  <span className="badge">{activity.type}</span>
                  <span className="muted">{new Date(activity.createdAt).toLocaleString("ja-JP")}</span>
                </div>
                <div style={{ marginTop: 6 }}>{activity.content}</div>
              </div>
            ))}
            {activities.length === 0 && <div className="muted">活動履歴はまだありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

