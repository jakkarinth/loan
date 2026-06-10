"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type ApiListResponse } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { LoanRequest } from "@/types/api";

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      apiFetch<ApiListResponse<LoanRequest>>(
        `/loans?pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
        .then((response) => setLoans(response.data))
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Loan Requests</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">รายการเงินยืม</h2>
          <p className="mt-2 text-sm text-slate-600">
            ค้นหา ตรวจสอบ และเปิดรายละเอียดรายการเงินยืมทั้งหมด
          </p>
        </div>
        <Link
          href="/loans/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <PlusCircle size={16} aria-hidden="true" />
          เพิ่มคำขอ
        </Link>
      </div>

      <div className="mb-4 flex max-w-md items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
        <Search size={18} className="text-slate-400" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ค้นหาเลขที่คำขอ เลขสัญญา หรือชื่อผู้ยืม"
          className="h-11 w-full border-0 bg-transparent text-sm outline-none"
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">เลขที่คำขอ</th>
                <th className="px-5 py-3">ผู้ยืม</th>
                <th className="px-5 py-3">หน่วยงาน</th>
                <th className="px-5 py-3">สถานะ</th>
                <th className="px-5 py-3 text-right">ยอดยืม</th>
                <th className="px-5 py-3 text-right">คงค้าง</th>
                <th className="px-5 py-3">ครบกำหนด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-center text-slate-500" colSpan={7}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : null}
              {!loading && loans.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-center text-slate-500" colSpan={7}>
                    ไม่พบรายการเงินยืม
                  </td>
                </tr>
              ) : null}
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/loans/${loan.id}`} className="font-medium text-brand hover:text-brand-dark">
                      {loan.request_no}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">{loan.contract_no ?? "-"}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-900">{loan.borrower_name}</td>
                  <td className="px-5 py-3 text-slate-600">{loan.department_name_th ?? "-"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge code={loan.status_code} label={loan.status_name_th} />
                  </td>
                  <td className="px-5 py-3 text-right">{formatMoney(loan.amount)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-950">
                    {formatMoney(loan.current_balance)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(loan.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
