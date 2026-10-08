import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: "#B4FF39",
          dim: "#8FD128",
          soft: "#E6FFB3",
        },
        charcoal: {
          DEFAULT: "#0C0F0C",
          light: "#12160F",
          deep: "#070907",
        },
        surface: {
          DEFAULT: "#151A14",
          raised: "#1C221A",
          overlay: "#232A21",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 28px rgba(180, 255, 57, 0.28)",
        "glow-sm": "0 0 14px rgba(180, 255, 57, 0.22)",
        card: "0 18px 40px -24px rgba(0, 0, 0, 0.9)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 26s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
