"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, CircleDollarSign, FileWarning, Send, TimerReset, Wallet } from "lucide-react";
import { apiFetch, type ApiDataResponse } from "@/lib/api";
import type { LoanRequest } from "@/types/api";

export function LoanActions({
  loan,
  onDone
}: {
  loan: LoanRequest;
  onDone: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function runAction(key: string, action: () => Promise<unknown>) {
    setLoading(key);
    setMessage(null);
    setError(null);
    try {
      await action();
      setMessage("บันทึกข้อมูลเรียบร้อย");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setLoading(null);
    }
  }

  async function submitLoan() {
    await runAction("submit", () =>
      apiFetch(`/loans/${loan.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ actor_id: loan.borrower_id, note: "ส่งคำขอเข้าตรวจสอบ" })
      })
    );
  }

  async function approveLoan() {
    await runAction("approve", () =>
      apiFetch(`/loans/${loan.id}/status`, {
        method: "POST",
        body: JSON.stringify({
          to_status_code: "approved",
          step: "approval",
          action: "approve",
          actor_id: 2,
          note: "อนุมัติรายการจากหน้ารายละเอียด"
        })
      })
    );
  }

  async function onPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("payment", () =>
      apiFetch(`/payments/loan/${loan.id}`, {
        method: "POST",
        body: JSON.stringify({
          payment_method: String(form.get("payment_method")),
          amount: Number(form.get("amount")),
          paid_date: String(form.get("paid_date")),
          plan_name: String(form.get("plan_name") || ""),
          fund_name: String(form.get("fund_name") || ""),
          payment_detail_no: String(form.get("payment_detail_no") || ""),
          note: "บันทึกจ่ายเงินจากหน้า UI",
          recorded_by: 2
        })
      })
    );
    event.currentTarget.reset();
  }

  async function onRepayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("repayment", () =>
      apiFetch(`/repayments/loan/${loan.id}`, {
        method: "POST",
        body: JSON.stringify({
          repayment_type: String(form.get("repayment_type")),
          amount: Number(form.get("amount")),
          receipt_no: String(form.get("receipt_no") || ""),
          cheque_no: String(form.get("cheque_no") || ""),
          voucher_no: String(form.get("voucher_no") || ""),
          repayment_date: String(form.get("repayment_date")),
          note: "บันทึกส่งใช้เงินยืมจากหน้า UI",
          recorded_by: 2
        })
      })
    );
    event.currentTarget.reset();
  }

  async function onExtension(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("extension", () =>
      apiFetch(`/extensions/loan/${loan.id}`, {
        method: "POST",
        body: JSON.stringify({
          requested_by: loan.borrower_id,
          requested_due_date: String(form.get("requested_due_date")),
          reason: String(form.get("reason"))
        })
      })
    );
    event.currentTarget.reset();
  }

  async function onNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("notice", () =>
      apiFetch<ApiDataResponse<{ id: number; notice_no: string }>>("/notices", {
        method: "POST",
        body: JSON.stringify({
          loan_request_id: loan.id,
          government_unit: String(form.get("government_unit")),
          document_date: String(form.get("document_date")),
          subject: String(form.get("subject")),
          details: String(form.get("details") || ""),
          issued_by: 2
        })
      })
    );
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={submitLoan}
          disabled={loading !== null}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <Send size={16} aria-hidden="true" />
          ส่งตรวจสอบ
        </button>
        <button
          onClick={approveLoan}
          disabled={loading !== null}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          อนุมัติ
        </button>
      </div>

      <ActionForm title="บันทึกจ่ายเงิน" icon={CircleDollarSign} onSubmit={onPayment}>
        <select name="payment_method" className={fieldClass} defaultValue="bank_transfer">
          <option value="bank_transfer">โอนเงิน</option>
          <option value="cash">เงินสด</option>
          <option value="cheque">เช็ค</option>
          <option value="other">อื่นๆ</option>
        </select>
        <input name="amount" type="number" defaultValue={Number(loan.current_balance)} className={fieldClass} />
        <input name="paid_date" type="date" className={fieldClass} required />
        <input name="payment_detail_no" placeholder="เลขที่ใบรายละเอียดการจ่าย" className={fieldClass} />
        <input name="plan_name" placeholder="แผนงาน" className={fieldClass} />
        <input name="fund_name" placeholder="กองทุน" className={fieldClass} />
      </ActionForm>

      <ActionForm title="บันทึกส่งใช้เงินยืม" icon={Wallet} onSubmit={onRepayment}>
        <select name="repayment_type" className={fieldClass} defaultValue="cash">
          <option value="cash">เงินสด</option>
          <option value="cheque">เช็ค</option>
          <option value="voucher">ใบสำคัญ</option>
          <option value="bank_transfer">โอนเงิน</option>
          <option value="other">อื่นๆ</option>
        </select>
        <input name="amount" type="number" placeholder="จำนวนเงิน" className={fieldClass} required />
        <input name="repayment_date" type="date" className={fieldClass} required />
        <input name="receipt_no" placeholder="เลขที่ใบเสร็จ" className={fieldClass} />
        <input name="cheque_no" placeholder="เลขที่เช็ค" className={fieldClass} />
        <input name="voucher_no" placeholder="เลขที่ใบสำคัญ" className={fieldClass} />
      </ActionForm>

      <ActionForm title="ขอขยายอายุสัญญา" icon={TimerReset} onSubmit={onExtension}>
        <input name="requested_due_date" type="date" className={fieldClass} required />
        <textarea name="reason" placeholder="เหตุผลการขอขยายอายุ" rows={3} className={textareaClass} required />
      </ActionForm>

      <ActionForm title="ออกหนังสือทวงเงินยืม" icon={FileWarning} onSubmit={onNotice}>
        <input
          name="government_unit"
          defaultValue="งานการเงิน มทร.อีสาน วิทยาเขตสุรินทร์"
          className={fieldClass}
          required
        />
        <input name="document_date" type="date" className={fieldClass} required />
        <input name="subject" defaultValue="บันทึกข้อความทวงเงินยืม" className={fieldClass} required />
        <textarea name="details" placeholder="รายละเอียดหนังสือ" rows={3} className={textareaClass} />
      </ActionForm>
    </div>
  );
}

const fieldClass =
  "h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light";
const textareaClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light";

function ActionForm({
  title,
  icon: Icon,
  onSubmit,
  children
}: {
  title: string;
  icon: React.ElementType;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-md border border-slate-200 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Icon size={16} className="text-brand" aria-hidden="true" />
        {title}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
      <div className="mt-3 flex justify-end">
        <button className="inline-flex min-h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700">
          บันทึก
        </button>
      </div>
    </form>
  );
}
