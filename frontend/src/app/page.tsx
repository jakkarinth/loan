"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Banknote, Clock3, FileText, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { apiFetch, type ApiDataResponse } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DashboardData } from "@/types/api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiDataResponse<DashboardData>>("/reports/dashboard")
      .then((response) => setDashboard(response.data))
      .catch((err: Error) => setError(err.message));
  }, []);

  const summary = dashboard?.summary;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            ภาพรวมลูกหนี้เงินยืม
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            ติดตามยอดเงินยืม รายการรอตรวจสอบ และลูกหนี้คงค้างของวิทยาเขต
          </p>
        </div>
        <Link
          href="/loans/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
        >
          บันทึกขอยืมเงิน
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="รายการทั้งหมด"
          value={summary ? String(summary.total_loans) : "-"}
        />
        <MetricCard
          icon={Banknote}
          label="ยอดเงินยืมรวม"
          value={summary ? formatMoney(summary.total_amount) : "-"}
        />
        <MetricCard
          icon={WalletCards}
          label="ลูกหนี้คงค้าง"
          value={summary ? formatMoney(summary.outstanding_amount) : "-"}
        />
        <MetricCard
          icon={AlertCircle}
          label="เกินกำหนด"
          value={summary ? String(summary.overdue_count) : "-"}
          danger
        />
      </section>

      <section className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-950">สรุปตามหน่วยงาน</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">หน่วยงาน</th>
                  <th className="px-5 py-3 text-right">จำนวน</th>
                  <th className="px-5 py-3 text-right">ยอดยืม</th>
                  <th className="px-5 py-3 text-right">คงค้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(dashboard?.by_department ?? []).map((item) => (
                  <tr key={item.department_name_th}>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {item.department_name_th}
                    </td>
                    <td className="px-5 py-3 text-right">{item.total_loans}</td>
                    <td className="px-5 py-3 text-right">{formatMoney(item.total_amount)}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-950">
                      {formatMoney(item.outstanding_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-semibold text-slate-950">รายการตามสถานะ</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(dashboard?.by_status ?? []).map((item) => (
              <div key={item.code} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Clock3 size={16} className="text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 text-sm text-slate-700">{item.name_th}</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  danger = false
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className={danger ? "rounded-md bg-red-50 p-3 text-red-600" : "rounded-md bg-brand-light p-3 text-brand"}>
          <Icon size={24} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
