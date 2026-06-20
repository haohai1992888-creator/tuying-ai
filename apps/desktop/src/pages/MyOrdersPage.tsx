import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";

interface Order {
  id: string;
  orderNo: string;
  amount: number;
  points: number;
  status: string;
  paymentMethod: string | null;
  packageName: string | null;
  createdAt: string;
  paidAt: string | null;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "待支付",
    PAID: "已支付",
    CLOSED: "已关闭",
    REFUNDED: "已退款",
  };
  return map[status] ?? status;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    apiFetch<Order[]>("/api/orders").then((res) => setOrders(res.data ?? []));
  }, []);

  return (
    <main className="container">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>我的订单</h1>
          <Link to="/recharge" className="btn btn-secondary">
            去充值
          </Link>
        </div>

        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>订单号</th>
              <th>套餐</th>
              <th>金额</th>
              <th>积分</th>
              <th>支付方式</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#64748b" }}>
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td title={order.orderNo}>{order.orderNo.slice(0, 14)}...</td>
                  <td>{order.packageName ?? "-"}</td>
                  <td>¥{order.amount}</td>
                  <td>{order.points}</td>
                  <td>{order.paymentMethod === "WECHAT" ? "微信" : order.paymentMethod === "ALIPAY" ? "支付宝" : "-"}</td>
                  <td>{statusLabel(order.status)}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
