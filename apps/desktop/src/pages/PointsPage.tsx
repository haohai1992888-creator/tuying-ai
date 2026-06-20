import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBalance, fetchPointLogs, type PointLogRecord } from "../api/payment";

export default function PointsPage() {
  const [balance, setBalance] = useState(0);
  const [logs, setLogs] = useState<PointLogRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchBalance(), fetchPointLogs()])
      .then(([points, list]) => {
        setBalance(points);
        setLogs(list);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"));
  }, []);

  return (
    <main className="container">
      <div className="card">
        <h1>积分中心</h1>
        <p>
          剩余积分: {balance}{" "}
          <Link to="/recharge" style={{ marginLeft: 8 }}>
            去充值
          </Link>
        </p>
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        <table className="table">
          <thead>
            <tr>
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
    </main>
  );
}
