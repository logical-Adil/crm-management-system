export const qk = {
  customers: {
    all: ["customers"] as const,
    list: (p: { page: number; limit: number; search: string }) =>
      ["customers", "list", p] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (p: { page: number; limit: number }) => ["users", "list", p] as const,
    directory: () => ["users", "directory", { page: 1, limit: 100 }] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    list: (p: { page: number; limit: number }) =>
      ["organizations", "list", p] as const,
  },
} as const;
