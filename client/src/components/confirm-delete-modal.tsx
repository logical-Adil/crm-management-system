"use client";

import type { ReactNode } from "react";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Simple confirmation overlay — use for destructive actions (e.g. delete user).
 */
export function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={loading ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="relative z-[101] w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-xl ring-1 ring-slate-900/[0.06]"
      >
        <h2 id="confirm-delete-title" className="text-heading font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <div className="mt-2 text-body text-muted">{description}</div>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-control border border-danger/20 bg-red-50 px-3 py-2 text-small text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-control border border-border bg-background px-4 py-2 text-body font-medium text-foreground transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-control bg-danger px-4 py-2 text-body font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
