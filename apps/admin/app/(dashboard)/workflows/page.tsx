"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface WorkflowRow {
  id: string;
  name: string;
  description: string;
  version: string;
  nodeCount: number;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowRow[]>([]);

  useEffect(() => {
    apiFetch<WorkflowRow[]>("/api/admin/workflows").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setWorkflows(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>工作流管理</h1>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>版本</th>
            <th>节点数</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf) => (
            <tr key={wf.id}>
              <td>{wf.id}</td>
              <td>{wf.name}</td>
              <td>{wf.version}</td>
              <td>{wf.nodeCount}</td>
              <td>{wf.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
