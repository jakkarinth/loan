"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiFetch, downloadAuthenticated, type ApiDataResponse } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DashboardData } from "@/types/api";

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiDataResponse<DashboardData>>("/reports/dashboard")
      .then((response) => setDashboard(response.data))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Reports</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">รายงานสรุป</h2>
          <p className="mt-2 text-sm text-slate-600">
            รายงานสรุปยอดเงินยืม ลูกหนี้คงค้าง และสถานะรายการ
          </p>
        </div>
        <div className="flex gap-2">
          <DocButton href="/documents/reports/summary.pdf" fileName="loan-summary-report.pdf" label="PDF" />
          <DocButton href="/documents/reports/summary.doc" fileName="loan-summary-report.doc" label="Word" />
        </div>
      </div>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <ReportBox label="ยอดเงินยืมรวม" value={formatMoney(dashboard?.summary.total_amount)} />
        <ReportBox label="ยอดคงค้าง" value={formatMoney(dashboard?.summary.outstanding_amount)} />
        <ReportBox label="รายการเกินกำหนด" value={String(dashboard?.summary.overdue_count ?? "-")} />
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-950">สรุปตามสถานะ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">สถานะ</th>
                <th className="px-5 py-3 text-right">จำนวน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(dashboard?.by_status ?? []).map((item) => (
                <tr key={item.code}>
                  <td className="px-5 py-3">{item.name_th}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-950">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function DocButton({ href, fileName, label }: { href: string; fileName: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadAuthenticated(href, fileName)}
      className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Export {label}
    </button>
  );
}

function ReportBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
