import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ms: {
          blue: "#0078D4",
          blueDark: "#005A9E",
          bg: "#FAF9F8",
          border: "#E1DFDD",
          text: "#201F1E",
          muted: "#605E5C",
          green: "#0F7B3A",
          greenBg: "#E6F4EA",
          red: "#A80000",
          redBg: "#FDE7E9",
        },
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05)",
        raised: "0 4px 18px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "-apple-system",
          "BlinkMacSystemFont",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
