import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        border: "var(--border)",
        surface: "var(--surface)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          hover: "var(--danger-hover)",
        },
        success: "var(--success)",
        disabled: "var(--disabled)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        title: ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        heading: ["1.125rem", { lineHeight: "1.75rem", fontWeight: "500" }],
        body: ["0.875rem", { lineHeight: "1.5rem" }],
        small: ["0.75rem", { lineHeight: "1.25rem" }],
      },
      borderRadius: {
        card: "0.5rem",
        control: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
} satisfies Config;
