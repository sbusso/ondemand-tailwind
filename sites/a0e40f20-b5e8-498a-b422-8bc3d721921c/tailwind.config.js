module.exports = {
  purge: ["./**/*.html"],
  darkMode: "media", // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require("daisyui")],
  daisyui: {
    styled: true,
    themes: ["light", "dark"],
    base: true,
    utils: true,
    logs: false,
    rtl: false,
  },
  //   plugins: [require("sailui")],
};
