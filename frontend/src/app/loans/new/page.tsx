import { AppShell } from "@/components/app-shell";
import { LoanForm } from "@/features/loans/loan-form";

export default function NewLoanPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-medium text-brand">Loan Request</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">
          บันทึกรายการขอยืมเงิน
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          กรอกรายละเอียดคำขอเพื่อสร้างเลขที่คำขอยืมและเข้าสู่ workflow ตรวจสอบ
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <LoanForm />
      </div>
    </AppShell>
  );
}
