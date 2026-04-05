"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/query";
import {
  updateUserSchema,
  type UpdateUserFormValues,
} from "@/lib/validations/update-user.schema";
import {
  deleteUserRequest,
  getUserByIdRequest,
  updateUserRequest,
  type UserDetail,
} from "@/lib/users/users-api";
import { formInputBase, formInputError, formInputMuted } from "@/styles/form-classes";

export function EditUserClient() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = typeof params.id === "string" ? params.id : "";

  const { user: authedUser, accessToken, isReady, isAuthenticated } = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: "", role: "member" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isReady && isAuthenticated && authedUser && authedUser.role !== "admin") {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, authedUser, router]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !accessToken || !id || authedUser?.role !== "admin") {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingUser(true);
      setLoadError(null);
      try {
        const u = await getUserByIdRequest(accessToken, id);
        if (cancelled) return;
        setDetail(u);
        reset({
          name: u.name ?? "",
          role: u.role === "admin" ? "admin" : "member",
        });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          setLoadError(e.message);
        } else {
          setLoadError("Could not load user.");
        }
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, accessToken, id, authedUser?.role, reset]);

  const onSubmit = async (data: UpdateUserFormValues) => {
    if (!accessToken || !id) return;
    setRootError(null);
    setSuccess(null);
    try {
      const nameTrim = data.name.trim();
      const updated = await updateUserRequest(accessToken, id, {
        name: nameTrim === "" ? undefined : nameTrim,
        role: data.role,
      });
      setDetail(updated);
      setSuccess("User updated.");
    } catch (e) {
      if (e instanceof ApiError) {
        setRootError(e.message);
        return;
      }
      setRootError("Could not update user.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!accessToken || !id) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await deleteUserRequest(accessToken, id);
      void queryClient.invalidateQueries({ queryKey: qk.users.all });
      setDeleteOpen(false);
      router.push("/users");
    } catch (e) {
      if (e instanceof ApiError) {
        setDeleteError(e.message);
      } else {
        setDeleteError("Could not delete user.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || authedUser?.role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Redirecting…</p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-body text-muted">Loading user…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-body text-danger">{loadError}</p>
        <Link href="/users" className="mt-4 inline-block text-body font-medium text-primary hover:underline">
          ← Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/users"
        className="text-small font-medium text-primary hover:underline"
      >
        ← Users
      </Link>
      <h1 className="mt-4 text-title text-foreground">Edit user</h1>
      <p className="mt-1 text-body text-muted">
        Update name and role. Email is read-only.
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
          <label htmlFor="edit-email" className="block text-small font-medium text-foreground">
            Email
          </label>
          <input
            id="edit-email"
            type="email"
            disabled
            className={formInputMuted}
            value={detail?.email ?? ""}
            readOnly
            placeholder="—"
          />
          <p className="text-small text-muted">
            Email cannot be changed after the account is created.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-name" className="block text-small font-medium text-foreground">
            Name
          </label>
          <input
            id="edit-name"
            type="text"
            autoComplete="name"
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
          <label htmlFor="edit-role" className="block text-small font-medium text-foreground">
            Role
          </label>
          <select
            id="edit-role"
            className={errors.role ? formInputError : formInputBase}
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

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-control bg-primary px-4 py-2.5 text-body font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            className="rounded-control border border-danger/30 bg-background px-4 py-2.5 text-body font-semibold text-danger transition-colors hover:bg-red-50"
          >
            Delete user
          </button>
        </div>
      </form>

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete user?"
        description="This cannot be undone. The user will be removed from your organization."
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => !deleteLoading && setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
