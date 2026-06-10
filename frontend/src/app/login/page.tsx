"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("finance@example.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (!result?.ok) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next") || "/";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-4 inline-flex rounded-md bg-brand-light p-3 text-brand">
            <LogIn size={24} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-slate-600">
            ใช้บัญชีตัวอย่างหรือบัญชีที่สมัครใหม่เพื่อเข้าสู่ระบบ
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">อีเมล</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">รหัสผ่าน</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-light"
            />
          </label>
          <button
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link href="/register" className="font-medium text-brand hover:text-brand-dark">
            สมัครสมาชิก
          </Link>
          <span className="text-slate-500">ระบบบริหารลูกหนี้เงินยืม</span>
        </div>
      </div>
    </main>
  );
}
