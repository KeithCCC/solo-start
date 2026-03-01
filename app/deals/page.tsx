import { createDealAction, moveDealStageAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";
import type { DealStage } from "@/src/domain";

export const dynamic = "force-dynamic";

const STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation"];

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
}

export default async function DealsPage() {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const deals = await repos.deals.list(ownerId);
  const contacts = await repos.contacts.list(ownerId);

  const dealsByStage = STAGES.map((stage) => ({
    stage,
    rows: deals.filter((d) => d.stage === stage && d.status === "open"),
  }));

  return (
    <div>
      <h1 className="page-title">パイプライン</h1>

      <section className="card" style={{ marginBottom: 14 }}>
        <h3>新規案件</h3>
        <form action={createDealAction} className="row wrap">
          <select name="contactId" defaultValue="" required style={{ maxWidth: 220 }}>
            <option value="">コンタクト選択</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input name="title" placeholder="案件名" required style={{ maxWidth: 250 }} />
          <select name="stage" defaultValue="lead" style={{ maxWidth: 160 }}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input name="amount" placeholder="金額 (JPY)" type="number" min="0" style={{ maxWidth: 180 }} />
          <input name="expectedCloseDate" type="date" style={{ maxWidth: 180 }} />
          <button type="submit">追加</button>
        </form>
      </section>

      <div className="kanban">
        {dealsByStage.map((group) => (
          <section key={group.stage} className="column">
            <h3 style={{ marginTop: 0 }}>{group.stage}</h3>
            <div className="list">
              {group.rows.map((d) => (
                <div key={d.id} className="list-item">
                  <strong>{d.title}</strong>
                  <div className="muted">{formatYen(d.amount)}</div>
                  <form action={moveDealStageAction} className="row" style={{ marginTop: 6 }}>
                    <input type="hidden" name="id" value={d.id} />
                    <select name="stage" defaultValue={d.stage}>
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="secondary">
                      移動
                    </button>
                  </form>
                </div>
              ))}
              {group.rows.length === 0 && <div className="muted">案件なし</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

