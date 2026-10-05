import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saudara: {
          green: {
            50: "#f0fdf4",
            100: "#dcfce7",
            200: "#bbf7d0",
            500: "#22c55e",
            600: "#16a34a",
            700: "#15803d",
            800: "#166534",
            900: "#14532d",
          },
          orange: {
            50: "#fff7ed",
            100: "#ffedd5",
            500: "#f97316",
            600: "#ea580c",
            700: "#c2410c",
          },
          cream: {
            50: "#fdfbf7",
            100: "#f7f3eb",
            200: "#eee6d6",
          },
          charcoal: "#1f2937",
        },
      },
    },
  },
  plugins: [],
};
export default config;
