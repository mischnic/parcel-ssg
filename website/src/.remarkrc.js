function custom() {
  const visit = import("unist-util-visit");

  return async (tree) => {
    (await visit).visit(tree, (node) => {
      // TODO not supported by https://github.com/mapbox/rehype-prism/blob/main/index.js
      if (node.type === "code" && node.lang) {
        node.lang = node.lang.replace(/\/.*$/, "");
      }
    });
  };
}
module.exports = {
  static: true,
  plugins: ["remark-gfm", custom],
};
