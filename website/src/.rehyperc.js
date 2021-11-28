const h = require("hastscript");

const well = (type) => (properties, children) =>
  h("figure", { class: `well ${type}` }, h("div", children));

const Sample = (properties, children) =>
  h("figure", { class: `well sample` }, h("div.assets", children));

const SampleFile = ({ name }, children) =>
  h("div.asset", [h("em", name), children]);

const Migration = (properties, children) => {
  let assets = children.filter(
    (c) => c.type === "element" && c.tagName === "sample-file"
  );
  if (assets.length === 1) assets.splice(0, 0, null);
  assets.splice(1, 0, h("div.arrow"));

  return h(
    "figure",
    { class: `migration well warning` },
    h("div.assets", assets)
  );
};

const escText = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

function collectTocPlugin({ data }) {
  const visit = import("unist-util-visit");
  const _toString = import("hast-util-to-string");

  return async (tree) => {
    let toString = (await _toString).toString;
    let headings = [];
    let stack = [];
    (await visit).visit(tree, (node) => {
      if (node.type === "element") {
        let match = node.tagName.match(/h(\d)/)?.[1];
        if (match) {
          let level = Number(match);
          let data = {
            id: node.properties.id,
            content: toString(node),
            level,
            children: [],
          };
          if (stack.length === 0) {
            headings.push(data);
            stack.push([level, headings]);
          } else {
            let [previousLevel, list] = stack[stack.length - 1];
            if (previousLevel < level) {
              let children = list[list.length - 1].children;
              children.push(data);
              stack.push([level, children]);
            } else if (previousLevel > level) {
              stack.pop();
              let [, list] = stack[stack.length - 1];
              list.push(data);
            } else {
              list.push(data);
            }
          }
        }
      }
    });

    if (headings.length > 0) {
      let toc = `<nav class="toc">\n`;
      (function walk(list) {
        toc += "<ol>\n";
        for (let child of list) {
          toc += "<li>\n";
          toc += `<a href="#${child.id}">${escText(child.content)}</a>`;
          if (child.children.length > 0) {
            walk(child.children);
          }
          toc += "</li>\n";
        }
        toc += "</ol>\n";
      })(headings);
      toc += "</nav>";

      data.toc = toc;
    } else {
      data.toc = null;
    }
  };
}

module.exports = (data) => ({
  static: true,
  plugins: [
    [
      "rehype-components",
      {
        components: {
          note: well("note"),
          warning: well("warning"),
          error: well("error"),
          sample: Sample,
          "sample-file": SampleFile,
          migration: Migration,
        },
      },
    ],
    "rehype-slug",
    [collectTocPlugin, { data }],
    [
      "rehype-autolink-headings",
      {
        behavior: "append",
        properties: {
          ariaHidden: true,
          tabIndex: -1,
          className: ["header-anchor"],
        },
        content: {
          type: "text",
          value: "#",
        },
      },
    ],
    "@mapbox/rehype-prism",
  ],
});
