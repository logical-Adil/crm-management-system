"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  createCustomerSchema,
  type CreateCustomerFormValues,
} from "@/lib/validations/create-customer.schema";
import { createCustomerRequest } from "@/lib/customers/customers-api";
import { formInputBase, formInputError } from "@/styles/form-classes";

export function CreateCustomerClient() {
  const router = useRouter();
  const { accessToken, isReady, isAuthenticated } = useAuth();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: { name: "", email: "", phone: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  const onSubmit = async (data: CreateCustomerFormValues) => {
    if (!accessToken) return;
    setRootError(null);
    try {
      const created = await createCustomerRequest(accessToken, {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
      });
      router.push(`/customers/${created.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        setRootError(e.message);
        return;
      }
      setRootError("Could not create customer.");
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

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/customers" className="text-small font-medium text-primary hover:underline">
        ← Customers
      </Link>
      <h1 className="mt-4 text-title text-foreground">Create customer</h1>
      <p className="mt-1 text-body text-muted">
        New customers are assigned to you. Maximum 5 active customers per user.
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

        <div className="space-y-1.5">
          <label htmlFor="cc-name" className="block text-small font-medium text-foreground">
            Name
          </label>
          <input
            id="cc-name"
            className={errors.name ? formInputError : formInputBase}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-small text-danger" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cc-email" className="block text-small font-medium text-foreground">
            Email
          </label>
          <input
            id="cc-email"
            type="email"
            className={errors.email ? formInputError : formInputBase}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-small text-danger" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cc-phone" className="block text-small font-medium text-foreground">
            Phone <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="cc-phone" className={errors.phone ? formInputError : formInputBase} {...register("phone")} />
          {errors.phone && (
            <p className="text-small text-danger" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-control bg-primary px-4 py-2.5 text-body font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create customer"}
        </button>
      </form>
    </div>
  );
}
