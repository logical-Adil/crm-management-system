"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { qk } from "@/lib/query";
import {
  customerNoteSchema,
  type CustomerNoteFormValues,
} from "@/lib/validations/customer-note.schema";
import {
  addCustomerNoteRequest,
  assignCustomerRequest,
  deleteCustomerRequest,
  getCustomerRequest,
  restoreCustomerRequest,
  updateCustomerRequest,
  type CustomerDetail,
} from "@/lib/customers/customers-api";
import {
  updateCustomerSchema,
  type UpdateCustomerFormValues,
} from "@/lib/validations/update-customer.schema";
import { listUsersRequest } from "@/lib/users/users-api";
import { formatDateTime } from "@/lib/format-date";
import {
  formInputBase,
  formInputError,
  formInputMuted,
  formNoteTextarea,
  formNoteTextareaMuted,
} from "@/styles/form-classes";

type CustomerDetailClientProps = {
  initialCustomer?: CustomerDetail | null;
  initialLoadError?: string | null;
  prefetchedAt?: number;
  serverUserId?: string;
  serverUserRole?: string;
};

export function CustomerDetailClient({
  initialCustomer: initialCustomerProp,
  initialLoadError: initialLoadErrorProp,
  prefetchedAt,
  serverUserId,
  serverUserRole,
}: CustomerDetailClientProps = {}) {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const queryClient = useQueryClient();
  const { user, accessToken, isReady, isAuthenticated, refreshSessionUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: customer,
    isLoading: loading,
    isError: loadFailed,
    error: queryError,
  } = useQuery({
    queryKey: qk.customers.detail(id),
    queryFn: () => getCustomerRequest(accessToken!, id),
    enabled: Boolean(isReady && isAuthenticated && accessToken && id),
    initialData: initialCustomerProp ?? undefined,
    initialDataUpdatedAt: prefetchedAt,
  });

  const loadError =
    loadFailed && queryError instanceof ApiError
      ? queryError.message
      : loadFailed
        ? "Could not load customer."
        : null;
  const displayLoadError =
    loadError ?? (!customer ? initialLoadErrorProp ?? null : null);

  const uid = user?.id ?? serverUserId;
  const assignedToMe =
    uid != null && customer?.assignedToId != null && customer.assignedToId === uid;
  const isDeleted = customer?.deletedAt != null;
  const canEdit = assignedToMe && !isDeleted;
  const canRestore = assignedToMe && isDeleted;
  const canAddNote = assignedToMe && !isDeleted;
  const isAdmin = user?.role === "admin" || serverUserRole === "admin";

  const { data: assignDirectory } = useQuery({
    queryKey: qk.users.directory(),
    queryFn: () => listUsersRequest(accessToken!, { page: 1, limit: 100 }),
    enabled: Boolean(isAdmin && accessToken && canEdit),
    staleTime: 60_000,
  });
  const assignUsers = assignDirectory?.results ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: { name: "", email: "", phone: "" },
    mode: "onBlur",
  });

  const noteForm = useForm<CustomerNoteFormValues>({
    resolver: zodResolver(customerNoteSchema),
    defaultValues: { body: "" },
  });

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    if (!customer) return;
    reset({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
    });
  }, [customer, reset]);

  const onSave = async (data: UpdateCustomerFormValues) => {
    if (!accessToken || !id || !canEdit) return;
    setFormError(null);
    setFormOk(null);
    try {
      const updated = await updateCustomerRequest(accessToken, id, {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
      });
      queryClient.setQueryData<CustomerDetail>(qk.customers.detail(id), prev =>
        prev ? { ...prev, ...updated, notes: prev.notes } : prev,
      );
      setFormOk("Saved.");
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
      } else {
        setFormError("Could not update.");
      }
    }
  };

  const onAddNote = async (data: CustomerNoteFormValues) => {
    if (!accessToken || !id || !canAddNote) return;
    setNoteError(null);
    try {
      const note = await addCustomerNoteRequest(accessToken, id, {
        body: data.body.trim(),
      });
      queryClient.setQueryData<CustomerDetail>(qk.customers.detail(id), prev =>
        prev ? { ...prev, notes: [note, ...prev.notes] } : prev,
      );
      noteForm.reset({ body: "" });
    } catch (e) {
      if (e instanceof ApiError) {
        setNoteError(e.message);
      } else {
        setNoteError("Could not add note.");
      }
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    setActionLoading(true);
    try {
      await deleteCustomerRequest(accessToken, id);
      void queryClient.invalidateQueries({ queryKey: qk.customers.all });
      await refreshSessionUser();
      setDeleteOpen(false);
      router.push("/customers");
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!accessToken || !id) return;
    setActionLoading(true);
    try {
      const updated = await restoreCustomerRequest(accessToken, id);
      queryClient.setQueryData<CustomerDetail>(qk.customers.detail(id), prev =>
        prev ? { ...prev, ...updated, notes: prev.notes } : prev,
      );
      await refreshSessionUser();
      setRestoreOpen(false);
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const [assignTo, setAssignTo] = useState("");

  const handleAssign = async () => {
    if (!accessToken || !id || !assignTo) return;
    setFormError(null);
    try {
      const updated = await assignCustomerRequest(accessToken, id, {
        assignToUserId: assignTo,
      });
      queryClient.setQueryData<CustomerDetail>(qk.customers.detail(id), prev =>
        prev ? { ...prev, ...updated, notes: prev.notes } : prev,
      );
      await refreshSessionUser();
      setAssignTo("");
      setFormOk("Reassigned.");
    } catch (e) {
      if (e instanceof ApiError) {
        setFormError(e.message);
      }
    }
  };

  const skipAuthShell = prefetchedAt != null;

  if (!skipAuthShell && (!isReady || !isAuthenticated)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-body text-muted">Loading…</p>
      </div>
    );
  }

  if (loading && !customer) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-body text-muted">Loading customer…</p>
      </div>
    );
  }

  if (displayLoadError || !customer) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <p className="text-body text-danger">{displayLoadError ?? "Not found."}</p>
        <Link href="/customers" className="mt-4 inline-block text-primary hover:underline">
          ← Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/customers" className="text-small font-medium text-primary hover:underline">
        ← Customers
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title text-foreground">{customer.name}</h1>
          <p className="mt-1 text-body text-muted">{customer.email}</p>
        </div>
        {isDeleted && (
          <span className="rounded-md bg-amber-100 px-2.5 py-1 text-small font-medium text-amber-900">
            Soft-deleted
          </span>
        )}
      </div>

      {!assignedToMe && (
        <div className="mt-4 rounded-control border border-border bg-slate-50 px-4 py-3 text-body text-muted">
          <span className="font-medium text-foreground">View only.</span> This customer is assigned
          to someone else — you can read details and existing notes, but not edit, add notes, delete,
          restore, or reassign.
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-heading font-semibold text-foreground">Details</h2>
        <form
          onSubmit={handleSubmit(onSave)}
          className="mt-4 max-w-md space-y-4"
          noValidate
        >
          {formError && (
            <div className="rounded-control border border-danger/25 bg-red-50 px-3 py-2 text-small text-red-800">
              {formError}
            </div>
          )}
          {formOk && (
            <div className="rounded-control border border-success/25 bg-emerald-50 px-3 py-2 text-small text-emerald-900">
              {formOk}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-small font-medium text-foreground">Name</label>
            <input
              className={canEdit ? (errors.name ? formInputError : formInputBase) : formInputMuted}
              disabled={!canEdit}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-small text-danger">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-small font-medium text-foreground">Email</label>
            <input
              type="email"
              className={canEdit ? (errors.email ? formInputError : formInputBase) : formInputMuted}
              disabled={!canEdit}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-small text-danger">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-small font-medium text-foreground">Phone</label>
            <input
              className={canEdit ? (errors.phone ? formInputError : formInputBase) : formInputMuted}
              disabled={!canEdit}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="text-small text-danger">{errors.phone.message}</p>
            )}
          </div>

          {canEdit && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-control bg-primary px-4 py-2 text-body font-semibold text-primary-foreground disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
          )}
        </form>
      </section>

      {canEdit && isAdmin && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-heading font-semibold text-foreground">Reassign</h2>
          <p className="mt-1 text-small text-muted">
            Transfer this active customer to another user in your organization (admins can pick from
            the directory).
          </p>
          <div className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={assignTo}
              onChange={e => setAssignTo(e.target.value)}
              className="flex-1 rounded-control border border-border bg-background px-3 py-2 text-body"
            >
              <option value="">Select user…</option>
              {assignUsers
                .filter(u => u.id !== (user?.id ?? serverUserId))
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name?.trim() || u.email} ({u.email})
                  </option>
                ))}
            </select>
            <button
              type="button"
              disabled={!assignTo}
              onClick={() => void handleAssign()}
              className="rounded-control border border-border bg-surface px-4 py-2 text-body font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </section>
      )}

      {canEdit && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-control border border-danger/30 px-4 py-2 text-body font-semibold text-danger hover:bg-red-50"
          >
            Delete customer (soft)
          </button>
        </div>
      )}

      {canRestore && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setRestoreOpen(true)}
            className="rounded-control bg-primary px-4 py-2 text-body font-semibold text-primary-foreground"
          >
            Restore customer
          </button>
        </div>
      )}

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-heading font-semibold text-foreground">Notes</h2>
        <p className="mt-1 text-small text-muted">
          {canAddNote
            ? "Only the assignee can add notes while this customer is active."
            : assignedToMe && isDeleted
              ? "Notes cannot be added while the customer is soft-deleted — restore them first."
              : "Only the assignee can add notes. You can read existing notes below."}
        </p>

        <form
          onSubmit={noteForm.handleSubmit(onAddNote)}
          className="mt-4 max-w-xl space-y-2"
        >
          {noteError && (
            <p className="text-small text-danger">{noteError}</p>
          )}
          <textarea
            rows={3}
            placeholder={canAddNote ? "Add a note…" : "Assignees can add notes here…"}
            disabled={!canAddNote}
            className={canAddNote ? formNoteTextarea : formNoteTextareaMuted}
            {...noteForm.register("body")}
          />
          {noteForm.formState.errors.body && (
            <p className="text-small text-danger">{noteForm.formState.errors.body.message}</p>
          )}
          <button
            type="submit"
            disabled={!canAddNote || noteForm.formState.isSubmitting}
            className="rounded-control bg-primary px-4 py-2 text-small font-semibold text-primary-foreground disabled:opacity-60"
          >
            {noteForm.formState.isSubmitting ? "Adding…" : "Add note"}
          </button>
        </form>

        <ul className="mt-6 space-y-4">
          {customer.notes.map(n => (
            <li
              key={n.id}
              className="rounded-control border border-border bg-slate-50/80 px-4 py-3 text-body"
            >
              <p className="whitespace-pre-wrap text-foreground">{n.body}</p>
              <p className="mt-2 text-small text-muted">{formatDateTime(n.createdAt)}</p>
            </li>
          ))}
          {customer.notes.length === 0 && (
            <li className="text-small text-muted">No notes yet.</li>
          )}
        </ul>
      </section>

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete this customer?"
        description="They will be hidden from the main list until restored (if you remain the assignee)."
        loading={actionLoading}
        onCancel={() => !actionLoading && setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDeleteModal
        open={restoreOpen}
        title="Restore customer?"
        description="This counts toward your limit of 5 active customers."
        confirmLabel="Restore"
        loading={actionLoading}
        onCancel={() => !actionLoading && setRestoreOpen(false)}
        onConfirm={handleRestore}
      />
    </div>
  );
}
