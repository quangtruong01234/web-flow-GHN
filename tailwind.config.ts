import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Indigo primary, matching the Claude Design (#4f46e5)
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        ink: {
          900: "#0f172a",
          700: "#344054",
          600: "#475467",
          500: "#667085",
          400: "#98a2b3",
        },
        line: "#e7e9ee",
        canvas: "#f1f3f6",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
