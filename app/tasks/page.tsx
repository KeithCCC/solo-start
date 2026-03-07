import { createTaskAction, markTaskDoneAction } from "@/app/actions";
import { getLocalOwnerId, getRepositories } from "@/lib/repositories";

export const dynamic = "force-dynamic";

function todayIsoJst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export default async function TasksPage() {
  const repos = getRepositories();
  const ownerId = getLocalOwnerId();
  const tasks = await repos.tasks.list(ownerId);

  const today = todayIsoJst();
  const todayTasks = tasks.filter((task) => task.dueDate === today && task.status !== "done");
  const upcoming = tasks.filter((task) => (task.dueDate ?? "9999-12-31") > today && task.status !== "done");
  const done = tasks.filter((task) => task.status === "done");

  return (
    <div>
      <h1 className="page-title">タスク</h1>
      <section className="card" style={{ marginBottom: 12 }}>
        <h3>新規タスク</h3>
        <form action={createTaskAction} className="row wrap">
          <input name="title" placeholder="タスク名" required style={{ maxWidth: 280 }} />
          <select name="type" defaultValue="daily_todo" style={{ maxWidth: 220 }}>
            <option value="daily_todo">daily_todo</option>
            <option value="customer_engagement">customer_engagement</option>
            <option value="project_task">project_task</option>
          </select>
          <input name="dueDate" type="date" style={{ maxWidth: 180 }} />
          <button type="submit">追加</button>
        </form>
      </section>

      <div className="split">
        <section className="card">
          <h3>Today</h3>
          <div className="list">
            {todayTasks.map((task) => (
              <div key={task.id} className="list-item">
                <div className="row wrap">
                  <strong>{task.title}</strong>
                  <span className="badge">{task.type}</span>
                </div>
                <form action={markTaskDoneAction} style={{ marginTop: 8 }}>
                  <input type="hidden" name="id" value={task.id} />
                  <button type="submit" className="secondary">
                    完了
                  </button>
                </form>
              </div>
            ))}
            {todayTasks.length === 0 && <div className="muted">本日のタスクなし</div>}
          </div>
        </section>

        <section className="card">
          <h3>Upcoming</h3>
          <div className="list">
            {upcoming.map((task) => (
              <div key={task.id} className="list-item">
                <div className="row wrap">
                  <strong>{task.title}</strong>
                  <span className="muted">{task.dueDate}</span>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <div className="muted">次の予定なし</div>}
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>Done</h3>
        <div className="list">
          {done.map((task) => (
            <div key={task.id} className="list-item">
              <strong>{task.title}</strong>
            </div>
          ))}
          {done.length === 0 && <div className="muted">完了タスクなし</div>}
        </div>
      </section>
    </div>
  );
}

