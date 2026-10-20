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
        track: {
          950: "#090D12",
          900: "#0D1117", // Main background: Deep night asphalt
          800: "#161B22", // Card/Surface
          700: "#21262D", // Elevated surface / Hover
          600: "#30363D", // Border / Divider
          500: "#484F58",
          400: "#8B949E", // Muted text
          300: "#C9D1D9",
          200: "#E6EDF3",
          100: "#F0F6FC", // Text primary
        },
        volt: {
          DEFAULT: "#D2FF00", // High-Vis Running Accent
          hover: "#BEEC00",
          dim: "rgba(210, 255, 0, 0.12)",
          text: "#0D1117",
        },
        pace: {
          blue: "#388BFD",
          orange: "#FA5E38",
          green: "#3FB950",
          purple: "#BC8CFF",
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
