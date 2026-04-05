/**
 * Placeholder home — replace with login redirect or /customers when wiring routes.
 */
export default function Home() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-card border border-border bg-surface p-8 shadow-card">
        <h1 className="text-title text-foreground">CRM client</h1>
        <p className="mt-2 text-body text-muted">
          Next.js app is running. Connect it to the Nest API when you build
          pages.
        </p>
        <dl className="mt-6 space-y-2 text-small text-muted">
          <div className="flex justify-between gap-4">
            <dt className="shrink-0">API base</dt>
            <dd className="truncate font-mono text-foreground" title={apiBase}>
              {apiBase}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-small text-muted">
          Set{" "}
          <code className="rounded bg-background px-1 py-0.5 text-foreground">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          in <code className="rounded bg-background px-1 py-0.5">.env.local</code>{" "}
          if needed (see <code className="rounded bg-background px-1 py-0.5">.env.example</code>
          ).
        </p>
      </div>
    </div>
  );
}
