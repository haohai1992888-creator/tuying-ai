"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface LogRow {
  id: string;
  userNickname: string | null;
  type: string;
  amount: number;
  balance: number;
  remark: string | null;
  createdAt: string;
}

export default function PointsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogRow[]>([]);

  useEffect(() => {
    apiFetch<LogRow[]>("/api/admin/points/logs").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setLogs(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>积分管理</h1>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>用户</th>
            <th>类型</th>
            <th>变动</th>
            <th>余额</th>
            <th>备注</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.userNickname ?? "-"}</td>
              <td>{log.type}</td>
              <td>{log.amount}</td>
              <td>{log.balance}</td>
              <td>{log.remark ?? "-"}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
