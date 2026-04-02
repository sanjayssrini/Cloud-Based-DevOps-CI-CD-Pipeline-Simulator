"use client";

import Link from "next/link";
import { ArrowRight, Blocks, Cloud, Rocket, ShieldCheck, Workflow } from "lucide-react";

const features = [
  { icon: Workflow, title: "Deterministic CI/CD", description: "State-machine simulation with retries, timeouts, and reproducible seeds." },
  { icon: Blocks, title: "Git Workflow Labs", description: "Commit graph, branches, checkout, and merge behavior in a safe sandbox." },
  { icon: Rocket, title: "Deployment Simulation", description: "Environment-aware deployments with stable simulation URLs." },
  { icon: ShieldCheck, title: "Secure Multi-Role Access", description: "Student, Instructor, and Admin workflows with strict RBAC." },
  { icon: Cloud, title: "Real-Time Terminal Logs", description: "WebSocket stream of ANSI-styled logs for realistic debugging." }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mesh">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-brand-ocean/20 bg-white/90 p-10 shadow-ambient backdrop-blur">
          <p className="mb-4 inline-flex rounded-full bg-brand-sand px-4 py-1 text-sm font-semibold text-brand-ink">Cloud-Based DevOps CI/CD Pipeline Simulator</p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-brand-ink md:text-6xl">
            Learn production DevOps by running a fully simulated pipeline platform.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Experience Git workflows, CI/CD execution, deployment environments, guided labs, and competitive gamification with deterministic outcomes.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-brand-ocean px-6 py-3 font-semibold text-white shadow-sm transition hover:translate-y-[-2px] hover:bg-brand-ink">
              Start Free Lab <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="rounded-xl border border-brand-ocean/30 px-6 py-3 font-semibold text-brand-ink transition hover:bg-brand-ocean/10">Sign In</Link>
            <Link href="/dashboard" className="rounded-xl border border-brand-coral/40 px-6 py-3 font-semibold text-brand-ink transition hover:bg-brand-coral/10">Open Dashboard</Link>
            <a href="#how-it-works" className="rounded-xl border border-brand-ocean/30 px-6 py-3 font-semibold text-brand-ink transition hover:bg-brand-ocean/10">
              Explore Flow
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-bold text-brand-ink">Platform Capabilities</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-ambient">
              <feature.icon className="h-8 w-8 text-brand-aqua" />
              <h3 className="mt-4 text-xl font-semibold text-brand-ink">{feature.title}</h3>
              <p className="mt-2 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10" id="how-it-works">
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold">1. Upload & Analyze</h3>
            <p className="mt-2 text-slate-600">Import ZIP projects and auto-detect runtime, dependencies, and suggested stages.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold">2. Build Pipeline</h3>
            <p className="mt-2 text-slate-600">Configure Build, Test, Deploy, and custom stages with conditional execution.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold">3. Execute & Learn</h3>
            <p className="mt-2 text-slate-600">Debug logs, validate tutorial steps, deploy to simulated environments, and rank on leaderboard.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h2 className="text-3xl font-bold text-brand-ink">Architecture Preview</h2>
          <p className="mt-2 text-slate-600">Layered modular design with real-time simulation flows.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {[
              "Next.js UI",
              "Controller",
              "Service",
              "Repository",
              "PostgreSQL + Prisma"
            ].map((layer) => (
              <div
                key={layer}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-brand-ink"
              >
                {layer}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-brand-ink p-10 text-white">
          <h2 className="text-3xl font-bold">Ready to master CI/CD operations safely?</h2>
          <p className="mt-2 text-slate-300">Create an account, run your first simulated pipeline, and debug failures in a guided tutorial path.</p>
          <Link href="/register" className="mt-6 inline-flex rounded-xl bg-brand-coral px-6 py-3 font-semibold transition hover:opacity-90">
            Create Account and Launch
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        Cloud-Based DevOps CI/CD Pipeline Simulator • Deterministic Learning Platform
      </footer>
    </main>
  );
}
