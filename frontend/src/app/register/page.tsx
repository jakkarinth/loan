"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { apiFetch, type ApiDataResponse, type ApiListResponse } from "@/lib/api";
import type { Department } from "@/types/api";

export default function RegisterPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<ApiListResponse<Department>>("/departments?pageSize=100")
      .then((response) => setDepartments(response.data))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body = {
      department_id: Number(form.get("department_id")),
      employee_code: String(form.get("employee_code") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      title_th: String(form.get("title_th") || ""),
      first_name_th: String(form.get("first_name_th") || ""),
      last_name_th: String(form.get("last_name_th") || ""),
      position_th: String(form.get("position_th") || "")
    };

    try {
      await apiFetch<ApiDataResponse<{ id: number }>>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 inline-flex rounded-md bg-brand-light p-3 text-brand">
            <UserPlus size={24} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">สมัครสมาชิก</h1>
          <p className="mt-2 text-sm text-slate-600">
            สร้างบัญชีบุคลากรสำหรับยื่นคำขอยืมเงินและติดตามสถานะ
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field name="employee_code" label="รหัสบุคลากร" />
          <Field name="email" label="อีเมล" type="email" required />
          <Field name="password" label="รหัสผ่าน" type="password" required />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">หน่วยงาน</span>
            <select
              name="department_id"
              required
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name_th}
                </option>
              ))}
            </select>
          </label>
          <Field name="title_th" label="คำนำหน้า" />
          <Field name="position_th" label="ตำแหน่ง" />
          <Field name="first_name_th" label="ชื่อ" required />
          <Field name="last_name_th" label="นามสกุล" required />
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <Link href="/login" className="text-sm font-medium text-brand hover:text-brand-dark">
              มีบัญชีแล้ว
            </Link>
            <button
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-6 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "กำลังบันทึก..." : "สมัครสมาชิก"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
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
