"use client";

import { memo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formSearchInput } from "@/styles/form-classes";

const SEARCH_DEBOUNCE_MS = 400;

type Props = {
  searchFromUrl: string;
  limit: number;
};

/**
 * Isolated search field: typing does not re-render the parent table (only this subtree).
 */
export const CustomersDebouncedSearch = memo(function CustomersDebouncedSearch({
  searchFromUrl,
  limit,
}: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(searchFromUrl);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === searchFromUrl) return;

    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      const sp = new URLSearchParams();
      sp.set("page", "1");
      sp.set("limit", String(limit));
      if (next) sp.set("search", next);
      router.replace(`/customers?${sp.toString()}`);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [searchInput, searchFromUrl, limit, router]);

  return (
    <div className="mt-6 max-w-xl">
      <label
        htmlFor="customer-search"
        className="mb-1.5 block text-small font-medium text-foreground"
      >
        Search
      </label>
      <input
        id="customer-search"
        type="search"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        placeholder="Search by name or email…"
        autoComplete="off"
        className={formSearchInput}
      />
      <p className="mt-1.5 text-small text-muted">
        Results update shortly after you stop typing ({SEARCH_DEBOUNCE_MS} ms debounce).
      </p>
    </div>
  );
});
