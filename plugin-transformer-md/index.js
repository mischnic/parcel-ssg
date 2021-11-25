const { Transformer } = require("@parcel/plugin");
const yaml = require("js-yaml");
const nunjucks = require("nunjucks");

async function mdToHtml(asset) {
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

  return { content: result.value, frontmatter: frontmatter?.value };
}

function renderTemplate(template, markdown, frontmatter) {
  let env = nunjucks.configure({ autoescape: true });
  return env.renderString(template, {
    ...frontmatter,
    // pages,
    content: markdown,
  });
}

module.exports = new Transformer({
  async transform({ asset, resolve, options }) {
    let { content, frontmatter } = await mdToHtml(asset);
    let parsedFrontmatter;

    if (frontmatter != null) {
      parsedFrontmatter = yaml.load(frontmatter);
    }
    asset.meta.frontmatter = parsedFrontmatter ?? {};

    if (parsedFrontmatter?.layout != null) {
      let layout = await resolve(asset.filePath, parsedFrontmatter?.layout);
      asset.invalidateOnFileChange(layout);
      content = renderTemplate(
        await options.inputFS.readFile(layout, "utf8"),
        content,
        parsedFrontmatter
      );
    }

    asset.setCode(content);
    asset.type = "html";
    return [asset];
  },
});
