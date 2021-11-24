const { Packager } = require("@parcel/plugin");
const nunjucks = require("nunjucks");

module.exports = new Packager({
  async package({ bundle, bundleGraph }) {
    let markdownAsset = bundle.getMainEntry();
    let templateAsset;

    bundle.traverse((a) => {
      if (a.type === "dependency" && a.value.meta.template === true) {
        templateAsset = bundleGraph.getResolvedAsset(a.value, bundle);
      } else if (a.value != markdownAsset && a.value != templateAsset) {
        throw new Error("Unexpected content in bundle");
      }
    });

    let [template, content] = await Promise.all([
      templateAsset?.getCode(),
      markdownAsset.getCode(),
    ]);

    let pages = bundleGraph
      .getBundles()
      .filter((b) => b.getMainEntry().meta.frontmatter != null)
      .map((b) => ({
        // TODO??
        url: "/" + b.name.replace(/.md$/, ".html"),
        data: b.getMainEntry().meta.frontmatter,
      }));

    let rendered = content;
    if (template != null) {
      let env = nunjucks.configure({ autoescape: true });
      rendered = env.renderString(template, {
        ...markdownAsset.meta.frontmatter,
        pages,
        content,
      });
    }

    return {
      contents: rendered,
      type: "html",
    };
  },
});
