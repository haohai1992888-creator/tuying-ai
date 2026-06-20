"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface PackageRow {
  id: string;
  name: string;
  points: number;
  price: number;
  enabled: boolean;
  sortOrder: number;
}

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [form, setForm] = useState({ name: "", points: 100, price: 9.9, sortOrder: 0 });
  const [message, setMessage] = useState("");

  async function load() {
    const res = await apiFetch<PackageRow[]>("/api/admin/packages");
    if (!res.success) {
      router.push("/login");
      return;
    }
    setPackages(res.data ?? []);
  }

  useEffect(() => {
    load();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const res = await apiFetch<PackageRow>("/api/admin/packages", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setMessage(res.success ? "套餐已创建" : (res.message ?? "创建失败"));
    if (res.success) {
      setForm({ name: "", points: 100, price: 9.9, sortOrder: 0 });
      load();
    }
  }

  async function toggleEnabled(pkg: PackageRow) {
    await apiFetch(`/api/admin/packages/${pkg.id}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: !pkg.enabled }),
    });
    load();
  }

  return (
    <div>
      <h1>套餐管理</h1>

      <form className="card" style={{ marginTop: 16, display: "grid", gap: 8, maxWidth: 480 }} onSubmit={onCreate}>
        <h3>新增套餐</h3>
        <input
          className="input"
          placeholder="套餐名称"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          type="number"
          placeholder="积分"
          value={form.points}
          onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
          required
        />
        <input
          className="input"
          type="number"
          step="0.01"
          placeholder="价格（元）"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          required
        />
        <button className="btn" type="submit">创建套餐</button>
        {message && <p>{message}</p>}
      </form>

      <table className="table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>名称</th>
            <th>积分</th>
            <th>价格</th>
            <th>排序</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{pkg.points}</td>
              <td>¥{pkg.price}</td>
              <td>{pkg.sortOrder}</td>
              <td>{pkg.enabled ? "上架" : "下架"}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => toggleEnabled(pkg)}>
                  {pkg.enabled ? "下架" : "上架"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
