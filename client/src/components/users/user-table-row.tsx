"use client";

import { memo, useCallback } from "react";

import { formatDateTime } from "@/lib/format-date";
import type { UserListItem } from "@/lib/users/users-api";

type Props = {
  row: UserListItem;
  onNavigate: (id: string) => void;
  onRequestDelete: (row: UserListItem) => void;
};

export const UserTableRow = memo(function UserTableRow({
  row,
  onNavigate,
  onRequestDelete,
}: Props) {
  const go = useCallback(() => {
    onNavigate(row.id);
  }, [onNavigate, row.id]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNavigate(row.id);
      }
    },
    [onNavigate, row.id],
  );

  const onDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRequestDelete(row);
    },
    [onRequestDelete, row],
  );

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={onKeyDown}
      className="cursor-pointer transition-colors hover:bg-slate-50/80"
    >
      <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{row.email}</td>
      <td className="max-w-[200px] truncate px-4 py-3 text-muted">{row.name?.trim() || "—"}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-small font-medium ${
            row.role === "admin"
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {row.role}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {row.isActive ? (
          <span className="text-success">Active</span>
        ) : (
          <span className="text-muted">Inactive</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(row.createdAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <button
          type="button"
          onClick={onDeleteClick}
          className="rounded-control border border-danger/25 px-2.5 py-1 text-small font-medium text-danger transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </td>
    </tr>
  );
});
