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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      maxWidth: {
        'container': '1200px',
        'form': '800px',
      },
      fontSize: {
        'xl-custom': '32px',
        '2xl-custom': '28px',
      },
      boxShadow: {
        'button': '0 4px 6px rgba(37, 99, 235, 0.2)',
        'button-hover': '0 6px 12px rgba(37, 99, 235, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;

