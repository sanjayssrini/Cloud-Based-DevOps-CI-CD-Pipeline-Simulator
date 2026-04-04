"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { useAppStore } from "@/store/app-store";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const setUser = useAppStore((s) => s.setUser);

  const register = useMutation({
    mutationFn: async () => {
      if (!name || !email || !password) {
        throw new Error("All fields are required");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      try {
        const { data } = await api.post("/auth/register", { name, email, password });
        return data;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Registration failed"));
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
      setErrorMsg(error.message || "Registration failed. Please try again.");
    }
  });

  return (
    <main className="min-h-screen bg-mesh px-6 py-14">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-ambient">
        <h1 className="text-3xl font-bold text-brand-ink">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Start your DevOps simulation journey.</p>

        <label htmlFor="register-name" className="mt-5 block text-sm font-medium text-slate-700">Name</label>
        <input id="register-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Your name" />

        <label htmlFor="register-email" className="mt-4 block text-sm font-medium text-slate-700">Email</label>
        <input id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="you@company.com" />

        <label htmlFor="register-password" className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Min 8 characters" />

        <button onClick={() => register.mutate()} disabled={register.isPending || !name || !email || !password} className="mt-6 w-full rounded-lg bg-brand-ink px-4 py-2 font-semibold text-white disabled:opacity-50">
          {register.isPending ? "Creating..." : "Create account"}
        </button>

        {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

        <p className="mt-5 text-sm text-slate-600">
          Already have an account? <Link href="/login" className="font-semibold text-brand-ocean">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
