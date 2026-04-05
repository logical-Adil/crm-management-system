"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/login.schema";
import {
  loginInputError,
  loginInputNormal,
  loginSubmitButton,
} from "@/styles/form-classes";

export function LoginScreen() {
  const router = useRouter();
  const { login, isReady, isAuthenticated } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setRootError(null);
    try {
      await login(data.email, data.password);
      reset({ ...data, password: "" });
    } catch (e) {
      if (e instanceof ApiError) {
        setRootError(e.message);
        return;
      }
      setRootError("Something went wrong. Try again.");
    }
  };

  if (!isReady) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-body text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-body text-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-slate-400/[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(250,250,250,0.8))]"
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-[420px]">
          <div className="overflow-hidden rounded-t-2xl bg-gradient-to-r from-primary to-blue-600 px-1 pt-1">
            <div className="rounded-t-[14px] bg-surface px-8 pb-0 pt-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner ring-1 ring-slate-200/80">
                  <Image
                    src="/logo.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    fetchPriority="high"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Sign in
                  </h1>
                  <p className="mt-1.5 text-body leading-relaxed text-muted">
                    Enter your work email and password to continue
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-b-2xl border border-t-0 border-border bg-surface px-8 pb-8 pt-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {rootError && (
                <div
                  className="rounded-control border border-danger/25 bg-red-50 px-3 py-2.5 text-center text-small text-red-800"
                  role="alert"
                >
                  {rootError}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-small font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin1@acme.demo"
                  className={errors.email ? loginInputError : loginInputNormal}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "login-email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="login-email-error" className="text-small text-danger" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-small font-medium text-foreground"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={errors.password ? loginInputError : loginInputNormal}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  {...register("password")}
                />
                {errors.password && (
                  <p id="login-password-error" className="text-small text-danger" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`${loginSubmitButton} mt-2`.trim()}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting && (
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                      aria-hidden
                    />
                  )}
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </span>
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-5 text-center">
              <p className="text-small text-muted">
                Seed example:{" "}
                <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                  admin1@acme.demo
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
