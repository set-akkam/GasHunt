module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        screens: {
          'xs': '475px',
        },
        colors: {
          primary: "#25a55f", // Primary Green
          brightGreen: "#2ecf77", // Bright Green
          darkGreen: "#1c7b47", // Dark Green
          lightGray: "#e6e6e6", // Light Gray
          mintGreen: "#57d992", // Mint Green
        },
      },
    },
    plugins: [require('@tailwindcss/forms'), require("tailwindcss-animate")],
  }