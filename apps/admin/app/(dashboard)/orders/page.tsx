"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";

interface OrderRow {
  id: string;
  orderNo: string;
  userLabel?: string;
  amount: number;
  points: number;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    apiFetch<OrderRow[]>("/api/admin/orders").then((res) => {
      if (!res.success) {
        router.push("/login");
        return;
      }
      setOrders(res.data ?? []);
    });
  }, [router]);

  return (
    <div>
      <h1>订单管理</h1>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>金额</th>
            <th>积分</th>
            <th>支付方式</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>支付时间</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td title={order.orderNo}>{order.orderNo.slice(0, 16)}...</td>
              <td>{order.userLabel ?? "-"}</td>
              <td>¥{order.amount}</td>
              <td>{order.points}</td>
              <td>{order.paymentMethod ?? "-"}</td>
              <td>{order.status}</td>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>{order.paidAt ? new Date(order.paidAt).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
