/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8ed",
          100: "#ffefd2",
          200: "#ffd9a5",
          300: "#ffbd6d",
          400: "#ff9832",
          500: "#ff7710",
          600: "#f15d06",
          700: "#c84508",
          800: "#9f3610",
          900: "#802f12"
        }
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        glow: "0 20px 80px rgba(255, 119, 16, 0.25)"
      }
    },
  },
  plugins: [],
};
