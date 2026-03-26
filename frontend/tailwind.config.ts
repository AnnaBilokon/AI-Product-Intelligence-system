import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10232d",
        paper: "#f5efe4",
        ember: "#c65f3d",
        tide: "#2f6c7a",
        moss: "#5e7b57",
        slate: "#6d7e86"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 35, 45, 0.12)",
        soft: "0 14px 34px rgba(16, 35, 45, 0.08)"
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top left, rgba(198,95,61,0.14), transparent 30%), radial-gradient(circle at 80% 20%, rgba(47,108,122,0.18), transparent 35%), linear-gradient(180deg, #f8f3eb 0%, #f0eadf 100%)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;