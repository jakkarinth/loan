"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { apiFetch, type ApiDataResponse, type ApiListResponse } from "@/lib/api";
import type { Department, ReferenceOption, UserSummary } from "@/types/api";

export function LoanForm() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loanTypes, setLoanTypes] = useState<ReferenceOption[]>([]);
  const [fundingSources, setFundingSources] = useState<ReferenceOption[]>([]);
  const [dueRules, setDueRules] = useState<ReferenceOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<ApiListResponse<Department>>("/departments?pageSize=100"),
      apiFetch<ApiListResponse<UserSummary>>("/users?pageSize=100"),
      apiFetch<ApiDataResponse<ReferenceOption[]>>("/reference/loan-types"),
      apiFetch<ApiDataResponse<ReferenceOption[]>>("/reference/funding-sources"),
      apiFetch<ApiDataResponse<ReferenceOption[]>>("/reference/due-date-rules")
    ])
      .then(([departmentRes, userRes, loanTypeRes, fundingRes, dueRuleRes]) => {
        setDepartments(departmentRes.data);
        setUsers(userRes.data);
        setLoanTypes(loanTypeRes.data);
        setFundingSources(fundingRes.data);
        setDueRules(dueRuleRes.data);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const borrowerId = Number(form.get("borrower_id"));
    const body = {
      borrower_id: borrowerId,
      department_id: Number(form.get("department_id")),
      loan_type_id: Number(form.get("loan_type_id")),
      funding_source_id: Number(form.get("funding_source_id")),
      due_date_rule_id: Number(form.get("due_date_rule_id")),
      objective: String(form.get("objective") || ""),
      project_name: String(form.get("project_name") || ""),
      project_start_date: String(form.get("project_start_date") || ""),
      project_end_date: String(form.get("project_end_date") || ""),
      amount: Number(form.get("amount")),
      due_date: String(form.get("due_date") || ""),
      remark: String(form.get("remark") || ""),
      created_by: borrowerId
    };

    try {
      const response = await apiFetch<ApiDataResponse<{ id: number; request_no: string }>>(
        "/loans",
        {
          method: "POST",
          body: JSON.stringify(body)
        }
      );
      router.push(`/loans/${response.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกคำขอไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="borrower_id" label="ผู้ยืม" options={users.map((user) => ({
          id: user.id,
          name: `${user.first_name_th} ${user.last_name_th}`
        }))} />
        <SelectField name="department_id" label="หน่วยงาน" options={departments.map((department) => ({
          id: department.id,
          name: department.name_th
        }))} />
        <SelectField name="loan_type_id" label="ประเภทการยืม" options={loanTypes.map((item) => ({
          id: item.id,
          name: item.name_th
        }))} />
        <SelectField name="funding_source_id" label="แหล่งเงิน" options={fundingSources.map((item) => ({
          id: item.id,
          name: item.name_th
        }))} />
        <SelectField name="due_date_rule_id" label="เงื่อนไขวันครบกำหนด" options={dueRules.map((item) => ({
          id: item.id,
          name: item.name_th
        }))} />
        <InputField name="amount" label="จำนวนเงิน" type="number" required />
        <InputField name="project_name" label="ชื่อโครงการ/กิจกรรม" />
        <InputField name="due_date" label="วันที่ครบกำหนด" type="date" required />
        <InputField name="project_start_date" label="วันที่เริ่มโครงการ" type="date" />
        <InputField name="project_end_date" label="วันที่สิ้นสุดโครงการ" type="date" />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">วัตถุประสงค์การยืม</span>
        <textarea
          name="objective"
          required
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">หมายเหตุ</span>
        <textarea
          name="remark"
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
        />
      </label>

      <div className="flex justify-end">
        <button
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {loading ? "กำลังบันทึก..." : "บันทึกคำขอ"}
        </button>
      </div>
    </form>
  );
}

function InputField({
  name,
  label,
  type = "text",
  required = false
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  options
}: {
  name: string;
  label: string;
  options: Array<{ id: number; name: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        required
        className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
      >
        <option value="">เลือกข้อมูล</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
