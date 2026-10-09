import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--c-white) / <alpha-value>)",
        neon: {
          DEFAULT: "#B4FF39",
          dim: "#8FD128",
          soft: "#E6FFB3",
        },
        charcoal: {
          DEFAULT: "rgb(var(--c-bg) / <alpha-value>)",
          light: "rgb(var(--c-bg-light) / <alpha-value>)",
          deep: "rgb(var(--c-bg-deep) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          raised: "rgb(var(--c-surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--c-surface-overlay) / <alpha-value>)",
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
