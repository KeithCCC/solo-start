import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const summary = await repos.dashboard.getSummary(ownerId);
  const deals = await repos.deals.list(ownerId, { limit: 5 });
  const tasks = await repos.tasks.list(ownerId, { limit: 5 });

  return (
    <div>
      <h1 className="page-title">ダッシュボード</h1>
      <div className="grid-3">
        <div className="card">
          <div className="metric-label">今日のタスク</div>
          <div className="metric-value">{summary.todayTaskCount}</div>
        </div>
        <div className="card">
          <div className="metric-label">パイプライン総額 (Open)</div>
          <div className="metric-value">{formatYen(summary.pipelineTotalJpy)}</div>
        </div>
        <div className="card">
          <div className="metric-label">最近接触</div>
          <div className="metric-value">{summary.recentTouchByContact.length}</div>
        </div>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>最近の案件</h3>
          <div className="list">
            {deals.map((deal) => (
              <div key={deal.id} className="list-item">
                <div className="row wrap">
                  <strong>{deal.title}</strong>
                  <span className="badge">{deal.stage}</span>
                  <span className="muted">{formatYen(deal.amount)}</span>
                </div>
              </div>
            ))}
            {deals.length === 0 && <div className="muted">案件がありません</div>}
          </div>
        </section>

        <section className="card">
          <h3>最近のタスク</h3>
          <div className="list">
            {tasks.map((task) => (
              <div key={task.id} className="list-item">
                <div className="row wrap">
                  <strong>{task.title}</strong>
                  <span className="badge">{task.type}</span>
                  <span className="muted">{task.status}</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <div className="muted">タスクがありません</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

