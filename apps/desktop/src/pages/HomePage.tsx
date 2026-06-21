import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { FEATURED_TEMPLATES, QUICK_ENTRIES } from "../components/layout/navItems";
import { apiFetch } from "../services/api";

interface Task {
  id: string;
  taskType: string;
  status: string;
  cost: number;
  createdAt: string;
}

function taskTypeLabel(type: string): string {
  const map: Record<string, string> = {
    scene_image: "生成商品图",
    white_background: "白底图",
    poster: "AI 海报",
    model_image: "AI 模特图",
  };
  return map[type] ?? type;
}

function statusBadge(status: string): { label: string; ok: boolean } {
  if (status === "SUCCESS" || status === "COMPLETED") return { label: "已完成", ok: true };
  if (status === "FAILED") return { label: "失败", ok: false };
  return { label: "进行中", ok: false };
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = useCallback(async () => {
    try {
      const res = await apiFetch<Task[]>("/api/tasks");
      setTasks((res.data ?? []).slice(0, 3));
    } catch {
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const displayTasks =
    tasks.length > 0
      ? tasks
      : [
          {
            id: "demo-1",
            taskType: "scene_image",
            status: "SUCCESS",
            cost: 10,
            createdAt: new Date().toISOString(),
          },
        ];

  return (
    <>
      <section className="dashboard-hero-row">
        <div className="dashboard-hero">
          <h1>AI 让电商更简单</h1>
          <div className="dashboard-hero__actions">
            <Link to="/scene-image" className="dashboard-hero__btn dashboard-hero__btn--primary">
              开始创作
            </Link>
            <button type="button" className="dashboard-hero__btn dashboard-hero__btn--ghost">
              观看教程
            </button>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="dashboard-stats__value">12,450</div>
          <div className="dashboard-stats__label">当前积分</div>
          <div className="dashboard-stats__progress">
            <div className="dashboard-stats__progress-head">
              <span>今日任务</span>
              <span>12 / 30</span>
            </div>
            <div className="dashboard-stats__bar">
              <span style={{ width: "40%" }} />
            </div>
          </div>
          <div className="dashboard-stats__member">
            高级会员 · 有效期至 2025-12-31
          </div>
        </div>
      </section>

      <section className="dashboard-quick">
        {QUICK_ENTRIES.map((item) => (
          <Link key={item.path} to={item.path} className="dashboard-quick__card">
            <div className="dashboard-quick__icon" style={{ background: item.color }}>
              {item.icon}
            </div>
            <div className="dashboard-quick__title">{item.title}</div>
            <div className="dashboard-quick__desc">{item.desc}</div>
          </Link>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <h2>热门模板推荐</h2>
          <Link to="/templates" className="dashboard-section__more">
            查看全部 →
          </Link>
        </div>
        <div className="dashboard-templates">
          {FEATURED_TEMPLATES.map((item) => (
            <Link key={item.name} to="/templates" className="dashboard-template">
              <div className="dashboard-template__cover" style={{ background: item.tone }} />
              <div className="dashboard-template__meta">
                <div className="dashboard-template__name">{item.name}</div>
                <div className="dashboard-template__count">{item.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__head">
          <h2>最近任务</h2>
          <Link to="/tasks" className="dashboard-section__more">
            查看全部 →
          </Link>
        </div>

        {displayTasks.map((task) => {
          const badge = statusBadge(task.status);
          return (
            <div key={task.id} className="dashboard-task">
              <div>
                <div className="dashboard-task__title">
                  {taskTypeLabel(task.taskType)}
                  <span className="dashboard-task__badge">{badge.label}</span>
                </div>
                <div className="dashboard-task__meta">
                  <span>创建时间 {new Date(task.createdAt).toLocaleString("zh-CN")}</span>
                  <span>任务 ID {task.id.slice(0, 8)}</span>
                  <span>模型 Seedream 3.0</span>
                  <span>尺寸 1024 × 1024</span>
                  <span>消耗积分 -{task.cost || 10}</span>
                </div>
                <div className="dashboard-task__thumbs">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="dashboard-task__thumb" />
                  ))}
                </div>
              </div>
              <div className="dashboard-task__actions">
                <Link to="/tasks" className="dashboard-task__view">
                  查看
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
