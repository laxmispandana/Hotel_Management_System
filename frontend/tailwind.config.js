/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b1120",
          900: "#0f172a",
          800: "#111827",
          700: "#1f2937",
          600: "#334155",
        },
        accent: {
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        glow: {
          500: "#22d3ee",
        },
      },
      boxShadow: {
        soft: "0 20px 45px rgba(15, 23, 42, 0.35)",
        glass: "0 20px 60px rgba(15, 23, 42, 0.45)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backdropBlur: {
        xl: "20px",
      },
    },
  },
  plugins: [],
};
