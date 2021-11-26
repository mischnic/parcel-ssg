function wellPlugin() {
  const visit = import("unist-util-visit");

  return async (tree) => {
    (await visit).visit(tree, (node) => {
      if (
        node.type === "textDirective" ||
        node.type === "leafDirective" ||
        node.type === "containerDirective"
      ) {
        if (node.name !== "warning") return;

        const data = node.data || (node.data = {});
        const tagName = node.type === "textDirective" ? "span" : "div";

        data.hName = tagName;
        data.hProperties = { class: node.name };
      }
    });
  };
}

module.exports = {
  static: true,
  plugins: ["remark-directive", "remark-math", wellPlugin],
};
