module.exports = {
  locales: ["de", "en"],
  sourceLocale: "de",
  catalogs: [
    {
      path: "src/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"]
    }
  ],
  format: "po"
};
