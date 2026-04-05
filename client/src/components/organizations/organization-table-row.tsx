"use client";

import { memo } from "react";

import type { OrganizationRow } from "@/lib/organizations/organizations-api";
import { formatDateTime } from "@/lib/format-date";

type Props = {
  row: OrganizationRow;
};

export const OrganizationTableRow = memo(function OrganizationTableRow({ row }: Props) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(row.createdAt)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(row.updatedAt)}</td>
    </tr>
  );
});
