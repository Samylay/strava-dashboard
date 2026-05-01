import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        strava: {
          DEFAULT: "#fc4c02",
          50: "#fff4ef",
          100: "#ffe5d6",
          200: "#ffc4a3",
          300: "#ff9a64",
          400: "#fc6f2f",
          500: "#fc4c02",
          600: "#e23f00",
          700: "#bb3300",
          800: "#902800",
          900: "#651c00",
        },
        bg: {
          DEFAULT: "#0b0c0e",
          card: "#15171c",
          subtle: "#1d2026",
          border: "#2a2e36",
        },
        fg: {
          DEFAULT: "#e7e9ee",
          muted: "#8b929d",
          subtle: "#5a606b",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
