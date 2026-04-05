/**
 * Client-only UI rules: edit/detail if you created the user or it is your own row;
 * delete only if you created the user and it is not yourself.
 */
export function canEditUser(
  row: { id: string; createdById: string | null },
  authedUserId: string,
): boolean {
  return row.createdById === authedUserId || row.id === authedUserId;
}

export function canDeleteUser(
  row: { id: string; createdById: string | null },
  authedUserId: string,
): boolean {
  return row.createdById === authedUserId && row.id !== authedUserId;
}
