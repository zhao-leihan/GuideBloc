import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1D4ED8", // Royal Blue
          50: "#F0F7FF",
          100: "#E0EFFF",
          200: "#B9DDFF",
          300: "#7CC2FF",
          400: "#3AA3FF",
          500: "#1D4ED8", // Electric Royal Blue
          600: "#1E40AF", // Deep Royal Blue
          700: "#1D4ED8",
          800: "#0F2E5C", // Deep Ocean Blue
          900: "#0B1D3A", // Dark Slate Blue
        },
        secondary: {
          DEFAULT: "#1D4ED8", // Royal Blue
          50: "#F0F7FF",
          100: "#E0EFFF",
          200: "#B9DDFF",
          300: "#7CC2FF",
          400: "#3AA3FF",
          500: "#1D4ED8", // Vibrant Royal Blue
          600: "#1E40AF",
          700: "#0F2E5C",
        },
        accent: {
          DEFAULT: "#1E40AF", // Deep Royal Blue Accent
          50: "#F0F7FF",
          100: "#E0EFFF",
          400: "#3AA3FF",
          500: "#1E40AF",
          600: "#1D4ED8",
        },
        dark: {
          DEFAULT: "#0F172A",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        danger: "#EF4444",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        gig: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
