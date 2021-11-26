const { Transformer } = require("@parcel/plugin");
const yaml = require("js-yaml");
const nunjucks = require("nunjucks");
const path = require("path");

const ATTRIBUTE_CONTENT = "dataParcelElementContent";

async function rehypeMarkNodes() {
  const { visit } = await import("unist-util-visit");

  return () => {
    return (tree) => {
      visit(tree, "element", (node) => {
        node.properties[ATTRIBUTE_CONTENT] = "";
      });
    };
  };
}

async function rehypeResolveUnmarkNodes() {
  const { visit } = await import("unist-util-visit");

  return ({ assetPath, layoutPath, resolve }) =>
    async (tree) => {
      let nodes = [];
      visit(tree, "element", (node) => {
        if (node.properties[ATTRIBUTE_CONTENT] != null) {
          delete node.properties[ATTRIBUTE_CONTENT];
          // TODO does doesn't cover everything
        } else if (node.properties.src || node.properties.href) {
          nodes.push(node);
        }
      });
      await Promise.all(
        nodes.map(async (node) => {
          // TODO does doesn't cover everything
          for (let name of ["src", "href"]) {
            if (node.properties[name] != null) {
              let specifier = node.properties[name];
              let result = await resolve(layoutPath, specifier).catch(() =>
                // TODO why is there no option for specifierType on resolve?
                resolve(layoutPath, "./" + specifier)
              );
              let rel = path.posix.relative(path.dirname(assetPath), result);
              node.properties[name] = rel.startsWith("../") ? rel : "./" + rel;
            }
          }
        })
      );
    };
}

async function resolveAndUnmark({ content, assetPath, layoutPath, resolve }) {
  // These are all ESM...
  const { VFile } = await import("vfile");
  const { rehype } = await import("rehype");
  const { default: rehypeStringify } = await import("rehype-stringify");

  let result = await rehype()
    .use()
    .use(await rehypeResolveUnmarkNodes(), { assetPath, layoutPath, resolve })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(new VFile(content));

  return result.value;
}

async function mdToHtml(asset, config) {
  const { VFile } = await import("vfile");
  const { remark } = await import("remark");
  const { default: remarkFrontMatter } = await import("remark-frontmatter");
  const { default: remarkRehype } = await import("remark-rehype");
  const { default: rehypeRaw } = await import("rehype-raw");
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
  processor = processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw);
  if (config?.rehype?.plugins) {
    for (let [plugin, options] of config?.rehype?.plugins) {
      processor = processor.use(plugin, options);
    }
  }

  processor = processor.use(await rehypeMarkNodes());

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
      let layoutPath = await resolve(asset.filePath, frontmatter?.layout);
      asset.invalidateOnFileChange(layoutPath);
      content = renderTemplate(
        await options.inputFS.readFile(layoutPath, "utf8"),
        content,
        frontmatter
      );
      content = await resolveAndUnmark({
        content,
        assetPath: asset.filePath,
        layoutPath,
        resolve,
      });
    }

    asset.setCode(content);
    asset.type = "html";
    return [asset];
  },
});
