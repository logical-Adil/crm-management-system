/**
 * Shared Tailwind CSS class strings for form controls across the CRM client.
 * Design tokens (`rounded-control`, `text-body`, `border-border`, …) come from `src/app/globals.css`.
 *
 * @module styles/form-classes
 */

// ---------------------------------------------------------------------------
// Login screen (`src/app/login/login-screen.tsx`)
// ---------------------------------------------------------------------------

/**
 * Minimal input shell for the login page (full width, border applied by variants below).
 * @usedBy login-screen.tsx — composed into {@link loginInputNormal} and {@link loginInputError}.
 */
export const loginInputRoot =
  "w-full rounded-control border bg-background px-3.5 py-2.5 text-body text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted";

/**
 * Default login field: neutral border + hover/focus ring.
 * @usedBy login-screen.tsx — email and password when valid.
 */
export const loginInputNormal = `${loginInputRoot} border-border hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15`;

/**
 * Login field validation error state.
 * @usedBy login-screen.tsx — email/password when `react-hook-form` reports an error.
 */
export const loginInputError = `${loginInputRoot} border-danger ring-1 ring-danger/20 focus:border-danger focus:ring-danger/20`;

/**
 * Primary gradient submit control on the login card.
 * @usedBy login-screen.tsx — “Sign in” button.
 */
export const loginSubmitButton =
  "group relative w-full overflow-hidden rounded-control bg-gradient-to-b from-primary to-blue-700 py-3 text-body font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[transform,box-shadow] hover:from-blue-600 hover:to-blue-800 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

// ---------------------------------------------------------------------------
// Standard forms: max-width, bordered inputs (customers / users CRUD + detail)
// ---------------------------------------------------------------------------

/**
 * Default editable text input for in-app forms (create/edit customer & user, customer detail).
 * @usedBy create-customer-client.tsx — name, email, phone
 * @usedBy create-user-client.tsx — email, password, name, role
 * @usedBy edit-user-client.tsx — name, role (editable)
 * @usedBy customer-detail-client.tsx — name, email, phone when `canEdit`
 */
export const formInputBase =
  "w-full max-w-md rounded-control border border-border bg-background px-3.5 py-2.5 text-body text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15";

/**
 * Validation error styling for {@link formInputBase}.
 * @usedBy create-customer-client.tsx, create-user-client.tsx, edit-user-client.tsx, customer-detail-client.tsx
 */
export const formInputError = `${formInputBase} border-danger ring-1 ring-danger/20 focus:border-danger focus:ring-danger/20`;

/**
 * Read-only or disabled styling (view-only fields, locked email, etc.).
 * @usedBy customer-detail-client.tsx — detail fields when not assignee or soft-deleted
 * @usedBy edit-user-client.tsx — email (read-only), inactive user name/role
 */
export const formInputMuted = `${formInputBase} cursor-not-allowed bg-slate-50 text-muted`;

// ---------------------------------------------------------------------------
// Customer notes (`src/app/customers/[id]/customer-detail-client.tsx`)
// ---------------------------------------------------------------------------

/**
 * Editable note textarea (assignee, active customer).
 * @usedBy customer-detail-client.tsx — note `textarea` when `canAddNote`
 */
export const formNoteTextarea =
  "w-full rounded-control border border-border bg-background px-3 py-2 text-body";

/**
 * Disabled note textarea (non-assignee or soft-deleted rules).
 * @usedBy customer-detail-client.tsx — note field when `!canAddNote`
 */
export const formNoteTextareaMuted = `${formInputMuted} min-h-[5.5rem] resize-none`;

// ---------------------------------------------------------------------------
// Customer list search (`src/components/customers/customers-debounced-search.tsx`)
// ---------------------------------------------------------------------------

/**
 * Debounced org-wide customer search field above the table.
 * @usedBy customers-debounced-search.tsx
 */
export const formSearchInput =
  "w-full rounded-control border border-border bg-background px-3.5 py-2.5 text-body text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15";
