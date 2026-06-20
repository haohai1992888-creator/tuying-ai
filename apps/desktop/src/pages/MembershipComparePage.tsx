import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";

interface PlanBenefits {
  label: string;
  priceMonthly: number;
  giftPoints: number;
  dailySignInPoints: number;
  maxConcurrency: number;
  routerPriority: string;
  features: string[];
}

export default function MembershipComparePage() {
  const [benefits, setBenefits] = useState<Record<string, PlanBenefits>>({});

  useEffect(() => {
    apiFetch<Record<string, PlanBenefits>>("/api/membership/benefits").then((res) => {
      setBenefits(res.data ?? {});
    });
  }, []);

  const plans = ["FREE", "VIP", "ENTERPRISE"];

  return (
    <div className="page">
      <h1>会员权益对比</h1>
      <p style={{ color: "#64748b" }}>
        <Link to="/membership">返回会员中心</Link>
      </p>
      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>权益</th>
            {plans.map((key) => (
              <th key={key}>{benefits[key]?.label ?? key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>月费</td>
            {plans.map((key) => (
              <td key={key}>{benefits[key]?.priceMonthly ? `¥${benefits[key].priceMonthly}` : "免费"}</td>
            ))}
          </tr>
          <tr>
            <td>开通赠送积分</td>
            {plans.map((key) => (
              <td key={key}>{benefits[key]?.giftPoints ?? "-"}</td>
            ))}
          </tr>
          <tr>
            <td>每日签到</td>
            {plans.map((key) => (
              <td key={key}>+{benefits[key]?.dailySignInPoints ?? 0}</td>
            ))}
          </tr>
          <tr>
            <td>最大并发</td>
            {plans.map((key) => (
              <td key={key}>{benefits[key]?.maxConcurrency ?? "-"}</td>
            ))}
          </tr>
          <tr>
            <td>路由策略</td>
            {plans.map((key) => (
              <td key={key}>{benefits[key]?.routerPriority ?? "-"}</td>
            ))}
          </tr>
          {plans[0] &&
            benefits[plans[0]]?.features.map((_, idx) => (
              <tr key={idx}>
                <td>功能 {idx + 1}</td>
                {plans.map((key) => (
                  <td key={key}>{benefits[key]?.features[idx] ?? "-"}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
