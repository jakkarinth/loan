"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiFetch, type ApiListResponse } from "@/lib/api";
import type { UserSummary } from "@/types/api";

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ApiListResponse<UserSummary>>("/users?pageSize=100")
      .then((response) => setUsers(response.data))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm font-medium text-brand">Users</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">สมาชิกระบบ</h2>
        <p className="mt-2 text-sm text-slate-600">
          ตรวจสอบรายชื่อผู้ใช้งานและบทบาทที่ถูกกำหนดไว้
        </p>
      </div>
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">ชื่อ</th>
                <th className="px-5 py-3">อีเมล</th>
                <th className="px-5 py-3">หน่วยงาน</th>
                <th className="px-5 py-3">บทบาท</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-3 font-medium text-slate-950">
                    {user.first_name_th} {user.last_name_th}
                  </td>
                  <td className="px-5 py-3">{user.email}</td>
                  <td className="px-5 py-3">{user.department_name_th ?? "-"}</td>
                  <td className="px-5 py-3">{typeof user.roles === "string" ? user.roles : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
