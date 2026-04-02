"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

type LoadingCtaButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
};

export function LoadingCtaButton({ href, children, variant = "solid", className = "" }: LoadingCtaButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const baseClasses =
    "inline-flex items-center gap-2 rounded-full text-sm font-semibold transition disabled:cursor-wait disabled:opacity-80";
  const variantClasses =
    variant === "solid"
      ? "bg-brand-ink px-4 py-2 text-white shadow-sm hover:bg-brand-ocean"
      : "border border-slate-300 bg-white px-4 py-2 text-brand-ink hover:border-brand-ocean hover:text-brand-ocean";

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (isLoading) {
          event.preventDefault();
          return;
        }

        setIsLoading(true);
        router.prefetch?.(href);
      }}
      aria-busy={isLoading}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : null}
      <span>{children}</span>
      {!isLoading ? <ArrowRight size={16} /> : null}
    </Link>
  );
}