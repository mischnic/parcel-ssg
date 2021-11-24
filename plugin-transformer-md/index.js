const { Transformer } = require("@parcel/plugin");
const yaml = require("js-yaml");

module.exports = new Transformer({
  async transform({ asset }) {
    // These are all ESM...
    const { remark } = await import("remark");
    const { default: remarkFrontMatter } = await import("remark-frontmatter");
    const { default: remarkRehype } = await import("remark-rehype");
    const { default: rehypeStringify } = await import("rehype-stringify");

    const processor = remark();

    /** @type undefined | { layout?: string, ... } */
    let frontmatter;

    let result = await processor
      .use(remarkFrontMatter)
      .use(() => (tree) => {
        frontmatter = tree.children.find((c) => c.type === "yaml");
      })
      // TODO
      //.use(...user defined plugins)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(await asset.getCode());

    if (frontmatter != null) {
      frontmatter = yaml.load(frontmatter.value);
    }
    asset.meta.frontmatter = frontmatter ?? {};

    if (frontmatter?.layout != null) {
      asset.addURLDependency(frontmatter?.layout, {
        // TODO can't be inline
        bundleBehavior: "inline",
        meta: { template: true },
      });
    }

    asset.setCode(result.value);
    return [asset];
  },
});
