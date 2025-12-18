/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}", ".src/pages/Plan.tsx"],
  theme: {
    extend: {

      colors: {
        brand: {
          primary: "#0f766e",
          primaryLight: "#14b8a6",
          accent: "#f97316",
          accentLight: "#fb923c",
          surface: "#f8fafc",
          surfaceDark: "#0f172a",
        },
        status: {
          success: "#047857",
          successSoft: "#34d399",
          error: "#b91c1c",
          errorSoft: "#f87171",
          warning: "#f59e0b",
          info: "#0284c7",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        "space-xs": "0.5rem",
        "space-sm": "0.75rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
      },
      boxShadow: {
        card: "0 10px 30px -15px rgba(15, 118, 110, 0.25)",
      },
    },
  },
  plugins: [],
};
