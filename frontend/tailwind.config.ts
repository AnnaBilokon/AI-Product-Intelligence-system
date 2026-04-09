import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        paper: "#f8fbff",
        ember: "#f97316",
        tide: "#0f766e",
        moss: "#15803d",
        slate: "#64748b",
        mist: "#eef6ff",
      },
      boxShadow: {
        panel: "0 22px 55px rgba(15, 23, 42, 0.08)",
        soft: "0 12px 28px rgba(15, 23, 42, 0.06)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top left, rgba(14,165,233,0.14), transparent 28%), radial-gradient(circle at 80% 12%, rgba(249,115,22,0.10), transparent 30%), linear-gradient(180deg, #fafdff 0%, #f4f8fc 100%)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;