"use client";

import { memo, useCallback } from "react";

import type { CustomerListItem } from "@/lib/customers/customers-api";
import { formatDateTime } from "@/lib/format-date";

type Props = {
  row: CustomerListItem;
  mine: boolean;
  onNavigate: (id: string) => void;
  onRequestDelete: (row: CustomerListItem) => void;
};

export const CustomerTableRow = memo(function CustomerTableRow({
  row,
  mine,
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
      <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{row.name}</td>
      <td className="max-w-[180px] truncate px-4 py-3 text-muted">{row.email}</td>
      <td className="whitespace-nowrap px-4 py-3 text-muted">{row.phone || "—"}</td>
      <td className="whitespace-nowrap px-4 py-3">
        {mine ? (
          <span className="font-medium text-primary">You</span>
        ) : (
          <span className="text-muted">Other user</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(row.updatedAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {mine ? (
          <button
            type="button"
            onClick={onDeleteClick}
            className="rounded-control border border-danger/25 px-2.5 py-1 text-small font-medium text-danger transition-colors hover:bg-red-50"
          >
            Delete
          </button>
        ) : (
          <span className="text-small text-muted">—</span>
        )}
      </td>
    </tr>
  );
});
