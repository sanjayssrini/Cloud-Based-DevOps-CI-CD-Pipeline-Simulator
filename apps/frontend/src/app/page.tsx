import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Cloud,
  Code2,
  Cpu,
  FlaskConical,
  GitBranch,
  Globe2,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow
} from "lucide-react";
import { LoadingCtaButton } from "@/components/loading-cta-button";

const coreFeatures = [
  {
    icon: Cloud,
    title: "Project Upload & Analysis",
    description: "Upload ZIP projects, inspect file structure, detect runtime type, and generate deterministic build steps."
  },
  {
    icon: GitBranch,
    title: "Git Workflow Simulation",
    description: "Commit, branch, checkout, and merge in a safe repository sandbox with commit graph visibility."
  },
  {
    icon: Workflow,
    title: "Pipeline Builder",
    description: "Compose Build, Test, Deploy, and Custom stages with JSON-backed configs and conditions."
  },
  {
    icon: Rocket,
    title: "CI/CD Execution Engine",
    description: "Run deterministic pipelines with retries, timeouts, sequential flow, and failure propagation."
  },
  {
    icon: TerminalSquare,
    title: "Real-Time Logs",
    description: "Stream structured execution logs live to the terminal viewer while each run progresses."
  },
  {
    icon: Globe2,
    title: "Deployment Simulation",
    description: "Simulate Dev, Staging, and Prod environments with generated deployment URLs and switching."
  },
  {
    icon: FlaskConical,
    title: "Guided Tutorial Engine",
    description: "Step-locked labs with validation rules, hints, and context-aware progress tracking."
  },
  {
    icon: ShieldCheck,
    title: "Security & RBAC",
    description: "JWT auth, refresh tokens, bcrypt passwords, and role-based access for Student, Instructor, and Admin."
  },
  {
    icon: BadgeCheck,
    title: "Gamification & Analytics",
    description: "Score points, earn badges, rank on leaderboard, and review success rates and failure patterns."
  }
];

const workflow = [
  {
    step: "01",
    title: "Upload Project",
    text: "Drop in a real-world ZIP project and let the simulator detect the stack and structure."
  },
  {
    step: "02",
    title: "Configure Pipeline",
    text: "Use the builder to create a reproducible CI/CD flow with conditional stage logic."
  },
  {
    step: "03",
    title: "Run & Debug",
    text: "Execute the run, watch logs stream live, inspect failures, and retry deterministically."
  },
  {
    step: "04",
    title: "Deploy & Learn",
    text: "Simulate deployment environments, complete guided labs, and track progress with badges."
  }
];

const roles = [
  {
    name: "Student",
    icon: Layers3,
    points: ["Full simulation access", "Tutorials and step validation", "Progress tracking and badges"]
  },
  {
    name: "Instructor",
    icon: LayoutDashboard,
    points: ["Create labs and steps", "Define validation rules", "Monitor class analytics"]
  },
  {
    name: "Admin",
    icon: LockKeyhole,
    points: ["Manage users and roles", "Set system rules", "Track usage and health"]
  }
];

const platformStats = [
  { label: "Simulated modules", value: "9+" },
  { label: "Supported roles", value: "3" },
  { label: "Execution model", value: "State machine" },
  { label: "Realtime log stream", value: "WebSocket" }
];

function UploadCloud(props: React.SVGProps<SVGSVGElement>) {
  return <Cloud {...props} />;
}

function CloudDevOpsShowcase() {
  return (
    <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(0,167,167,0.16),transparent_36%),linear-gradient(180deg,rgba(8,16,27,0.98),rgba(13,27,42,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "30px 30px" }}
      />

      <div className="relative flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="max-w-[12rem] text-lg font-black leading-tight tracking-tight text-white sm:max-w-none sm:text-xl">Build fast, ship safe, scale clean.</h2>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">Live architecture view</div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300 sm:gap-3 sm:text-xs">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-aqua/25 bg-brand-aqua/10 px-3 py-2 text-center">
            <Code2 size={12} />
            Development
          </div>
          <div className="rounded-full border border-brand-sand/25 bg-brand-sand/10 px-3 py-2 text-center">Cloud</div>
          <div className="rounded-full border border-brand-coral/25 bg-brand-coral/10 px-3 py-2 text-center">Operations</div>
        </div>

        <div className="relative flex-1 min-h-[360px] sm:min-h-[400px]">
          <svg viewBox="0 0 640 420" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="signalA" x1="120" y1="160" x2="250" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00A7A7" />
                <stop offset="1" stopColor="#8DECEE" />
              </linearGradient>
              <linearGradient id="signalB" x1="250" y1="150" x2="390" y2="170" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F4D58D" />
                <stop offset="1" stopColor="#EE6C4D" />
              </linearGradient>
              <linearGradient id="signalC" x1="390" y1="220" x2="520" y2="260" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EE6C4D" />
                <stop offset="1" stopColor="#00A7A7" />
              </linearGradient>
            </defs>

            <path d="M158 292C205 316 246 318 289 300" stroke="url(#signalA)" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 12" className="animate-stroke-loop" />
            <path d="M290 194C325 182 361 182 398 194" stroke="url(#signalB)" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 12" className="animate-stroke-loop" />
            <path d="M398 194C445 206 488 234 530 274" stroke="url(#signalC)" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 12" className="animate-stroke-loop" />

            <circle cx="158" cy="292" r="8" fill="#00A7A7" />
            <circle cx="320" cy="194" r="8" fill="#F4D58D" />
            <circle cx="530" cy="274" r="8" fill="#EE6C4D" />
          </svg>

          <div className="relative z-10 grid h-full grid-rows-[1fr_auto_1fr] gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-brand-aqua/20 bg-brand-ink/80 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.3)] backdrop-blur">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-aqua/20 bg-brand-aqua/10 px-2.5 py-1 text-brand-aqua">
                  <Code2 size={14} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em]">Development</p>
                </div>
                <p className="mt-3 text-lg font-black text-white">Code + Build</p>
                <p className="mt-1 text-xs text-slate-300">Validate source, run tests, and produce artifacts.</p>
              </article>

              <article className="rounded-2xl border border-brand-coral/25 bg-brand-ocean/80 p-4 shadow-[0_14px_35px_rgba(0,0,0,0.3)] backdrop-blur">
                <div className="flex items-center gap-2 text-brand-sand">
                  <Rocket size={16} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em]">Operations</p>
                </div>
                <p className="mt-3 text-lg font-black text-white">Release + Monitor</p>
                <p className="mt-1 text-xs text-slate-200">Deploy workloads and observe health in real time.</p>
              </article>
            </div>

            <article className="mx-auto w-full max-w-[18rem] rounded-2xl border border-brand-sand/25 bg-slate-900/82 p-4 text-center shadow-[0_14px_35px_rgba(0,0,0,0.3)] backdrop-blur">
              <div className="flex items-center justify-center gap-2 text-brand-sand">
                <Cloud size={16} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em]">Cloud Layer</p>
              </div>
              <p className="mt-2 text-lg font-black text-white">Environment</p>
              <p className="mt-1 text-xs text-slate-300">Dev, staging, and prod simulation zones.</p>
            </article>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-200">
                <Workflow size={14} /> Unified Pipeline Signal
              </div>
              <p className="mt-2 text-sm font-semibold text-white">Live logs, policy checks, and deterministic run states.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(0,167,167,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(238,108,77,0.16),transparent_22%),linear-gradient(180deg,#f8fcfd_0%,#edf5f8_50%,#f6f1ea_100%)] text-brand-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-brand-aqua/18 blur-3xl animate-float-slow" />
        <div className="absolute right-[-8rem] top-36 h-96 w-96 rounded-full bg-brand-coral/16 blur-3xl animate-drift" />
        <div className="absolute left-1/2 top-[18%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-white/40 blur-3xl animate-float-slow" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-ocean/30 to-transparent opacity-70" />
        <div className="absolute left-8 right-8 top-28 h-40 rounded-[2rem] border border-white/50 bg-white/25 shadow-[0_20px_80px_rgba(13,27,42,0.06)] backdrop-blur-md animate-scanline" />
      </div>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-noise opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/70 bg-white/72 px-5 py-3 shadow-sm backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Cloud-Based DevOps CI/CD Pipeline Simulator</p>
              <p className="text-sm font-medium text-slate-700">A safe DevOps learning platform, fully simulated</p>
            </div>
            <div className="flex items-center gap-3">
              <LoadingCtaButton href="/login" variant="ghost">
                Sign In
              </LoadingCtaButton>
              <LoadingCtaButton href="/register" variant="solid">
                Start Free Lab
              </LoadingCtaButton>
            </div>
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/70 bg-white/78 p-8 shadow-ambient backdrop-blur-xl sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-aqua/20 bg-white/75 px-4 py-2 text-sm font-semibold text-brand-ocean shadow-sm">
                <Sparkles size={16} />
                Production-grade simulator for learning DevOps end to end
              </div>

              <h1 className="mt-6 max-w-2xl text-2xl font-black tracking-tight text-brand-ink sm:text-3xl lg:text-4xl">
                Run a real-looking CI/CD platform without touching real cloud infrastructure.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[0.98rem] sm:leading-8">
                Upload real projects, simulate repository operations, build deterministic pipelines, stream logs live, debug failures, deploy to fake environments, and learn through guided labs.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <LoadingCtaButton href="/register" variant="solid" className="px-6 py-3.5">
                  Create Account
                </LoadingCtaButton>
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-brand-ink transition hover:border-brand-ocean hover:text-brand-ocean">
                  Open Dashboard
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-brand-ink transition hover:border-brand-coral hover:text-brand-coral">
                  Explore Simulator Flow
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-4">
                {platformStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(13,27,42,0.06)]">
                    <p className="text-xl font-black text-brand-ink">{stat.value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(21,97,109,0.08),rgba(238,108,77,0.06))] p-5 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Plan", "Shape the release"],
                    ["Build", "Compile and package"],
                    ["Test", "Catch failures early"],
                    ["Deploy", "Ship to safe environments"]
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-2xl bg-white/90 px-4 py-3 shadow-[0_10px_25px_rgba(13,27,42,0.05)]">
                      <p className="text-sm font-bold text-brand-ink">{title}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(13,27,42,0.98),rgba(13,27,42,0.88))] p-4 text-white shadow-ambient sm:p-5">
              <CloudDevOpsShowcase />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-ocean">Exact project features</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-ink">Everything the simulator actually does</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              This intro page now reflects the real product surface: authentication, upload analysis, repository simulation, pipeline builder, execution engine, logs, deployment simulation, tutorial engine, validation, gamification, and analytics.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {coreFeatures.map((feature) => (
              <article key={feature.title} className="group rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 transition hover:-translate-y-1 hover:border-brand-ocean/30 hover:shadow-ambient">
                <div className="inline-flex rounded-2xl bg-brand-ocean/10 p-3 text-brand-ocean transition group-hover:bg-brand-ocean group-hover:text-white">
                  <feature.icon size={22} />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-brand-ink">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,rgba(245,250,252,0.85))] p-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-ocean">Workflow</p>
              <h2 className="mt-2 text-3xl font-black text-brand-ink">How the simulator should feel</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              The experience is designed as a real DevOps learning system, not a dead-end mockup.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-ambient">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-brand-ocean">{item.step}</p>
                <h3 className="mt-3 text-lg font-bold tracking-tight text-brand-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {roles.map((role) => (
            <article key={role.name} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="inline-flex rounded-2xl bg-brand-coral/10 p-3 text-brand-coral">
                <role.icon size={22} />
              </div>
              <h3 className="mt-5 text-2xl font-black text-brand-ink">{role.name}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                {role.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Cpu className="mt-1 shrink-0 text-brand-aqua" size={16} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] bg-brand-ink px-8 py-10 text-white shadow-ambient sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Ready to learn DevOps safely</p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">Start with a real-looking simulator instead of a blank demo shell.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Register, upload a ZIP project, watch the pipeline auto-generate, run the execution engine, review logs, and complete guided labs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-brand-coral px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5">
                Create Account <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80 py-8 text-center text-sm text-slate-500">
        Cloud-Based DevOps CI/CD Pipeline Simulator • Deterministic learning environment for DevOps workflows
      </footer>
    </main>
  );
}

