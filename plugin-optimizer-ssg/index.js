const { Optimizer } = require("@parcel/plugin");
const { blobToString } = require("@parcel/utils");
const nunjucks = require("nunjucks");

module.exports = new Optimizer({
  async optimize({ bundle, bundleGraph, contents }) {
    let entry = bundle.getMainEntry();
    if (entry?.meta.frontmatter == null) {
      return {
        contents: contents,
      };
    }

    let pages = bundleGraph
      .getBundles()
      .filter(
        (b) => b.type === "html" && b.getMainEntry().meta.frontmatter != null
      )
      .map((b) => ({
        // TODO??
        url: "/" + b.name.replace(/.md$/, ".html"),
        data: b.getMainEntry().meta.frontmatter,
      }));

    let input = (await blobToString(contents))
      .replace(/<!--ssg/g, "")
      .replace(/ssg-->/g, "");
    let env = nunjucks.configure({ autoescape: true });
    let output = env.renderString(input, {
      ...entry.meta.frontmatter,
      pages,
    });

    return {
      contents: output,
    };
  },
});
