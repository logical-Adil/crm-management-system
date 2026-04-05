"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "@/lib/validations/create-user.schema";
import { createUserRequest } from "@/lib/users/users-api";

const inputBase =
  "w-full max-w-md rounded-control border border-border bg-background px-3.5 py-2.5 text-body text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15";
const inputError = `${inputBase} border-danger ring-1 ring-danger/20 focus:border-danger focus:ring-danger/20`;

export function CreateUserClient() {
  const router = useRouter();
  const { user, accessToken, isReady, isAuthenticated } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "member",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isReady && isAuthenticated && user && user.role !== "admin") {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, user, router]);

  const onSubmit = async (data: CreateUserFormValues) => {
    if (!accessToken) return;
    setRootError(null);
    setSuccess(null);
    try {
      const body = {
        email: data.email.trim(),
        password: data.password,
        name: data.name?.trim() || undefined,
        role: data.role,
      };
      const created = await createUserRequest(accessToken, body);
      setSuccess(`User created: ${created.email} (${created.role}).`);
      reset({
        email: "",
        password: "",
        name: "",
        role: "member",
      });
    } catch (e) {
      if (e instanceof ApiError) {
        setRootError(e.message);
        return;
      }
      setRootError("Could not create user.");
    }
  };

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Redirecting…</p>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-title text-foreground">Create user</h1>
      <p className="mt-1 text-body text-muted">
        Add a user to your organization (admin only). Password must be at least 10 characters.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 max-w-md space-y-5"
        noValidate
      >
        {rootError && (
          <div
            className="rounded-control border border-danger/25 bg-red-50 px-3 py-2.5 text-small text-red-800"
            role="alert"
          >
            {rootError}
          </div>
        )}
        {success && (
          <div
            className="rounded-control border border-success/25 bg-emerald-50/90 px-3 py-2.5 text-small text-emerald-900"
            role="status"
          >
            {success}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="create-email" className="block text-small font-medium text-foreground">
            Email
          </label>
          <input
            id="create-email"
            type="email"
            autoComplete="off"
            className={errors.email ? inputError : inputBase}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-small text-danger" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-password" className="block text-small font-medium text-foreground">
            Password
          </label>
          <input
            id="create-password"
            type="password"
            autoComplete="new-password"
            className={errors.password ? inputError : inputBase}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-small text-danger" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-name" className="block text-small font-medium text-foreground">
            Name <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="create-name"
            type="text"
            autoComplete="name"
            className={errors.name ? inputError : inputBase}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-small text-danger" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="create-role" className="block text-small font-medium text-foreground">
            Role
          </label>
          <select
            id="create-role"
            className={errors.role ? inputError : inputBase}
            {...register("role")}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && (
            <p className="text-small text-danger" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-control bg-primary px-4 py-2.5 text-body font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create user"}
        </button>
      </form>
    </div>
  );
}
