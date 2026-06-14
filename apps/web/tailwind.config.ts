import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(222 20% 8%)",
        foreground: "hsl(210 40% 98%)",
        card: "hsl(222 20% 10%)",
        border: "hsl(215 20% 20%)",
        accent: "hsl(230 70% 60%)"
      },
      boxShadow: {
        glass: "0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.4)"
      },
      borderRadius: {
        lg: "14px"
      }
    }
  },
  plugins: []
};

export default config;
