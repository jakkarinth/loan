"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { LoanActions } from "@/features/loans/loan-actions";
import { apiFetch, downloadAuthenticated, type ApiDataResponse } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { LoanRequest } from "@/types/api";

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const [loan, setLoan] = useState<LoanRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLoan = useCallback(() => {
    apiFetch<ApiDataResponse<LoanRequest>>(`/loans/${params.id}`)
      .then((response) => setLoan(response.data))
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  useEffect(() => {
    loadLoan();
  }, [loadLoan]);

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/loans" className="inline-flex items-center gap-2 text-sm font-medium text-brand">
          <ArrowLeft size={16} aria-hidden="true" />
          กลับรายการเงินยืม
        </Link>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          รายละเอียดรายการเงินยืม
        </h2>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loan ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-slate-500">เลขที่คำขอ</p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                    {loan.request_no}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    เลขที่สัญญา {loan.contract_no ?? "-"}
                  </p>
                </div>
                <StatusBadge code={loan.status_code} label={loan.status_name_th} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Info label="ผู้ยืม" value={loan.borrower_name} />
                <Info label="หน่วยงาน" value={loan.department_name_th ?? "-"} />
                <Info label="ยอดเงินยืม" value={formatMoney(loan.amount)} />
                <Info label="ยอดคงค้าง" value={formatMoney(loan.current_balance)} />
                <Info label="ประเภทการยืม" value={loan.loan_type_name_th ?? "-"} />
                <Info label="แหล่งเงิน" value={loan.funding_source_name_th ?? "-"} />
                <Info label="วันที่จ่าย" value={formatDate(loan.paid_at)} />
                <Info label="ครบกำหนด" value={formatDate(loan.due_date)} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-950">เอกสารและการพิมพ์</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DocumentButton href={`/documents/loans/${loan.id}/contract.pdf`} fileName={`loan-contract-${loan.contract_no ?? loan.request_no}.pdf`} label="สัญญา PDF" />
                <DocumentButton href={`/documents/loans/${loan.id}/contract.doc`} fileName={`loan-contract-${loan.contract_no ?? loan.request_no}.doc`} label="สัญญา Word" />
                <DocumentButton href={`/documents/loans/${loan.id}/payment.pdf`} fileName={`payment-${loan.contract_no ?? loan.request_no}.pdf`} label="ใบจ่าย PDF" />
                <DocumentButton href={`/documents/loans/${loan.id}/payment.doc`} fileName={`payment-${loan.contract_no ?? loan.request_no}.doc`} label="ใบจ่าย Word" />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={18} className="text-brand" aria-hidden="true" />
                <h3 className="font-semibold text-slate-950">รายละเอียดคำขอ</h3>
              </div>
              <dl className="grid gap-4 text-sm">
                <Info label="ชื่อโครงการ/กิจกรรม" value={loan.project_name ?? "-"} />
                <Info label="วัตถุประสงค์" value={loan.objective} />
                <Info label="หมายเหตุ" value={loan.remark ?? "-"} />
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="font-semibold text-slate-950">ประวัติการดำเนินการ</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {(loan.approvals ?? []).map((item) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-950">
                          {item.from_status_code ?? "-"} → {item.to_status_code}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{item.note ?? "-"}</p>
                      </div>
                      <div className="text-sm text-slate-500 sm:text-right">
                        <p>{item.actor_name ?? "-"}</p>
                        <p>{formatDate(item.acted_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-950">ดำเนินการ</h3>
            <LoanActions loan={loan} onDone={loadLoan} />
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function DocumentButton({
  href,
  fileName,
  label
}: {
  href: string;
  fileName: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => downloadAuthenticated(href, fileName)}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      <Download size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
