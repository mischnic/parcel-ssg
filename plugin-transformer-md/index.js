const { Transformer } = require("@parcel/plugin");
const yaml = require("js-yaml");
const nunjucks = require("nunjucks");

async function mdToHtml(asset, config) {
  // These are all ESM...
  const { VFile } = await import("vfile");
  const { remark } = await import("remark");
  const { default: remarkFrontMatter } = await import("remark-frontmatter");
  const { default: remarkRehype } = await import("remark-rehype");
  const { default: rehypeStringify } = await import("rehype-stringify");

  let processor = remark();

  let frontmatter;
  processor = processor.use(remarkFrontMatter).use(() => (tree) => {
    let node = tree.children.find((c) => c.type === "yaml");
    if (node) {
      frontmatter = yaml.load(node.value);
    }
  });

  if (config?.remark?.plugins) {
    for (let [plugin, options] of config?.remark?.plugins) {
      processor = processor.use(plugin, options);
    }
  }
  processor = processor.use(remarkRehype, { allowDangerousHtml: true });
  if (config?.rehype?.plugins) {
    for (let [plugin, options] of config?.rehype?.plugins) {
      processor = processor.use(plugin, options);
    }
  }

  let result = await processor
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(new VFile({ path: asset.filePath, value: await asset.getCode() }));
  return { content: result.value, frontmatter };
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
  async loadConfig({ config, options }) {
    let remark = await config.getConfig([".remarkrc"]);
    let rehype = await config.getConfig([".rehyperc"]);
    let remarkResult = { plugins: [] };
    let rehypeResult = { plugins: [] };
    for (let [cfg, result] of [
      [remark, remarkResult],
      [rehype, rehypeResult],
    ]) {
      for (let plugin of cfg?.contents?.plugins ?? []) {
        let [name, opts] = Array.isArray(plugin) ? plugin : [plugin, {}];
        config.addDevDependency({
          resolveFrom: cfg.filePath,
          specifier: name,
        });
        let resolved = await options.packageManager.resolve(
          name,
          cfg.filePath,
          { saveDev: true }
        );
        result.plugins.push([(await import(resolved.resolved)).default, opts]);
      }
    }
    if (remark || rehype) {
      return {
        remark: remarkResult,
        rehype: rehypeResult,
      };
    }
  },

  async transform({ asset, config, resolve, options }) {
    let { content, frontmatter } = await mdToHtml(asset, config);

    asset.meta.frontmatter = frontmatter ?? {};

    if (frontmatter?.layout != null) {
      let layout = await resolve(asset.filePath, frontmatter?.layout);
      asset.invalidateOnFileChange(layout);
      content = renderTemplate(
        await options.inputFS.readFile(layout, "utf8"),
        content,
        frontmatter
      );
    }

    asset.setCode(content);
    asset.type = "html";
    return [asset];
  },
});
