const { heroui } = require('@heroui/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/components/(avatar|toast|spinner).js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        pill: "9999px",
      },
      colors: {
        brand: {
          DEFAULT: "#faff69",
          active: "#e6eb52",
          disabled: "#3a3a1f",
        },
        canvas: "#0a0a0a",
        ink: "#ffffff",
        copy: {
          DEFAULT: "#cccccc",
          strong: "#e6e6e6",
        },
        muted: {
          DEFAULT: "#888888",
          soft: "#5a5a5a",
        },
        hairline: {
          DEFAULT: "#2a2a2a",
          strong: "#3a3a3a",
        },
        surface: {
          soft: "#121212",
          card: "#1a1a1a",
          elevated: "#242424",
        },
        on: {
          primary: "#0a0a0a",
          dark: "#ffffff",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      maxWidth: {
        content: "1280px",
      },
      spacing: {
        section: "96px",
      },
      letterSpacing: {
        display: "-0.025em",
      },
    },
  },
  darkMode: ["class"],
  plugins: [require("tailwindcss-animate"), heroui()],
};
