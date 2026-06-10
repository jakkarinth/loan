"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { apiFetch, downloadAuthenticated, type ApiListResponse } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

type Notice = {
  id: number;
  loan_request_id: number;
  notice_no: string;
  request_no: string;
  contract_no: string | null;
  borrower_name: string;
  current_balance: string;
  document_date: string;
  subject: string;
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiListResponse<Notice>>("/notices?pageSize=50")
      .then((response) => setNotices(response.data))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-medium text-brand">Debt Notices</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">หนังสือทวงเงินยืม</h2>
        <p className="mt-2 text-sm text-slate-600">
          รายการบันทึกข้อความทวงเงินยืมที่ออกจากระบบ
        </p>
      </div>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">เลขที่หนังสือ</th>
                <th className="px-5 py-3">ผู้ยืม</th>
                <th className="px-5 py-3">สัญญา</th>
                <th className="px-5 py-3">วันที่</th>
                <th className="px-5 py-3 text-right">คงค้าง</th>
                <th className="px-5 py-3 text-right">เอกสาร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notices.map((notice) => (
                <tr key={notice.id}>
                  <td className="px-5 py-3 font-medium text-brand">{notice.notice_no}</td>
                  <td className="px-5 py-3">{notice.borrower_name}</td>
                  <td className="px-5 py-3">
                    <Link href={`/loans/${notice.loan_request_id}`} className="text-slate-700 hover:text-brand">
                      {notice.contract_no ?? notice.request_no}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{formatDate(notice.document_date)}</td>
                  <td className="px-5 py-3 text-right">{formatMoney(notice.current_balance)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <NoticeDocButton href={`/documents/notices/${notice.id}/notice.pdf`} fileName={`debt-notice-${notice.notice_no}.pdf`} label="PDF" />
                      <NoticeDocButton href={`/documents/notices/${notice.id}/notice.doc`} fileName={`debt-notice-${notice.notice_no}.doc`} label="Word" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function NoticeDocButton({ href, fileName, label }: { href: string; fileName: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadAuthenticated(href, fileName)}
      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}
