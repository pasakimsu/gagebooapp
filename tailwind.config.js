/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "shadow-[0px_6px_12px_rgba(0,0,0,0.4),_0px_-3px_6px_rgba(255,255,255,0.2)]",
    "hover:shadow-[0px_4px_10px_rgba(0,0,0,0.5),_0px_-2px_5px_rgba(255,255,255,0.2)]",
    "active:shadow-[0px_2px_6px_rgba(0,0,0,0.6),_0px_-1px_3px_rgba(255,255,255,0.1)]",
    "shadow-[0px_6px_12px_rgba(0,0,0,0.5),_inset_0px_-3px_6px_rgba(255,255,255,0.3)]",
    "active:shadow-[inset_0px_4px_8px_rgba(0,0,0,0.5),_inset_0px_-3px_6px_rgba(255,255,255,0.3)]",
    "translate-y-[2px]",
    "translate-y-[3px]",
    "translate-y-[4px]",
    "hover:translate-y-[2px]",
    "active:translate-y-[3px]",
    "active:translate-y-[4px]"
  ],
  theme: {
    extend: {
      colors: {
        beigeDark: "#3b3228",
        beigeLight: "#f5ede1",
        camel: "#d8bfa3",
        brownBorder: "#e3d9c8",
        darkText: "#4a4a4a",
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', "sans-serif"],
      },
      boxShadow: {
        neumorphism: "inset 4px 4px 10px rgba(0,0,0,0.3), 0px 4px 8px rgba(255,255,255,0.2)",
        pressed: "inset -4px -4px 10px rgba(0,0,0,0.3), 0px 4px 8px rgba(255,255,255,0.2)",
        deep: "0px 6px 12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
