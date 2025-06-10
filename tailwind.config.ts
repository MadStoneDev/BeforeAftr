import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        magnepixit: {
          primary: "#5B9994",
          secondary: "#F5BE63",
          tertiary: "#F5A8A9",
          quaternary: "#99C7E1",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
