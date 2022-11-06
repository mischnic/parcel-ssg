const h = require("hastscript");

function moveRangesPlugin() {
  const visit = import("unist-util-visit");
  return async (tree) => {
    (await visit).visit(tree, (node) => {
      if (
        node.type === "element" &&
        node.tagName === "code" &&
        node.properties.className
      ) {
        let className = node.properties.className;
        for (let i = 0; i < className.length; i++) {
          let n = className[i];
          if (n.startsWith("language-")) {
            if (n.includes("/")) {
              let [lang, range] = n.split("/");
              node.properties["data-hightlight-range"] = range;
              className[i] = lang;
            }
            break;
          }
        }
      }
    });
  };
}

function highlightLines() {
  const visit = import("unist-util-visit");
  const _groupByLines = import("@suin/refractor-group-by-lines");
  return async (tree) => {
    const groupByLines = (await _groupByLines).default.default;
    (await visit).visit(tree, (node) => {
      if (
        node.type === "element" &&
        node.tagName === "code" &&
        node.properties["data-hightlight-range"]
      ) {
        let range = node.properties["data-hightlight-range"];
        delete node.properties["data-hightlight-range"];
        let linesToHighlight = new Set();
        for (let r of range.split(",")) {
          let num = r !== "" ? Number(r) : NaN;
          if (!Number.isNaN(num)) {
            linesToHighlight.add(num);
            continue;
          }

          let match = r.match(/(\d+)-(\d+)/);
          if (match) {
            let a = Number(match[1]);
            let b = Number(match[2]);
            for (let i = a; i <= b; i++) {
              linesToHighlight.add(i);
            }
            continue;
          }
          throw new Error("unknown range");
        }

        let childrenGrouped = groupByLines(node.children);
        node.children = [];
        for (let n of childrenGrouped) {
          let line = n.properties["data-line-number"] - 1;
          delete n.properties["data-line-number"];
          if (linesToHighlight.has(line)) {
            n.tagName = "mark";
            n.properties.className = [
              "highlight-line",
              "highlight-line-active",
            ];
          } else {
            n.properties.className = ["highlight-line"];
          }
          // Remove "\n" text node
          n.children.splice(-1, 1);

          node.children.push(n, h("br"));
        }
      }
    });
  };
}

module.exports = {
  plugins: [moveRangesPlugin, require("@mapbox/rehype-prism"), highlightLines],
};
