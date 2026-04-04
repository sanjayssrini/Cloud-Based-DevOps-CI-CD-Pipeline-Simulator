"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { useAppStore } from "@/store/app-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const setUser = useAppStore((s) => s.setUser);

  const login = useMutation({
    mutationFn: async () => {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      try {
        const { data } = await api.post("/auth/login", { email, password });
        return data;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Login failed"));
      }
    },
    onSuccess: (data) => {
      setErrorMsg("");
      const user = { id: data.user.id, name: data.user.name, role: data.user.role };
      setAccessToken(data.accessToken);
      setUser(user);
      saveSession(data.accessToken, user);
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      setErrorMsg(error.message || "Login failed. Please try again.");
    }
  });

  return (
    <main className="min-h-screen bg-mesh px-6 py-14">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-ambient">
        <h1 className="text-3xl font-bold text-brand-ink">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Access your CI/CD simulator workspace.</p>

        <label htmlFor="login-email" className="mt-5 block text-sm font-medium text-slate-700">Email</label>
        <input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="you@company.com" />

        <label htmlFor="login-password" className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Your password" />

        <button onClick={() => login.mutate()} disabled={login.isPending || !email || !password} className="mt-6 w-full rounded-lg bg-brand-ocean px-4 py-2 font-semibold text-white disabled:opacity-50">
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>

        {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

        <p className="mt-5 text-sm text-slate-600">
          New here? <Link href="/register" className="font-semibold text-brand-ocean">Create account</Link>
        </p>
      </section>
    </main>
  );
}
