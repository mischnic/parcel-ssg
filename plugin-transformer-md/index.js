// @flow strict-local
"use strict";
const { Transformer } = require("@parcel/plugin");
const nunjucks = require("nunjucks");
const path = require("path");
const matter = require("gray-matter");

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
            if (
              node.properties[name] != null &&
              node.properties[name][0] !== "#" &&
              // TODO
              !node.properties[name].startsWith("http")
            ) {
              let specifier = node.properties[name];
              try {
                let result = await resolve(layoutPath, specifier).catch(() =>
                  // TODO why is there no option for specifierType on resolve?
                  resolve(layoutPath, "./" + specifier)
                );
                let rel = path.posix.relative(path.dirname(assetPath), result);
                node.properties[name] = rel.startsWith("../")
                  ? rel
                  : "./" + rel;
              } catch (e) {}
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

async function mdToHtml(assetPath, content, config, hasTemplate) {
  const { VFile } = await import("vfile");
  const { remark } = await import("remark");
  const { default: remarkRehype } = await import("remark-rehype");
  const { default: rehypeRaw } = await import("rehype-raw");
  const { default: rehypeStringify } = await import("rehype-stringify");

  let processor = remark();
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

  if (hasTemplate) {
    processor = processor.use(await rehypeMarkNodes());
  }

  let result = await processor
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(new VFile({ path: assetPath, value: content }));
  return result.value;
}

async function renderTemplate({
  layout,
  layoutPath,
  config,
  content,
  frontmatter,
}) {
  let env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(path.dirname(layoutPath)),
    {
      autoescape: true,
    }
  );
  config?.(env);
  return env.renderString(
    layout,
    {
      ...frontmatter,
      content,
    },
    { path: layoutPath }
  );
}

async function loadParentConfigs({ config, options }) {
  let p = config.searchPath;
  let result = [];
  while (p != options.projectRoot) {
    let data = await config.getConfigFrom(p, ["_data.json"]);
    if (data) {
      result.push(data.contents);
      p = path.join(path.dirname(path.dirname(data.filePath)), "index");
    } else {
      break;
    }
  }
  let merged = {};
  for (let i = result.length - 1; i >= 0; i--) {
    merged = { ...merged, ...result[i] };
  }
  return merged;
}

module.exports = (new Transformer({
  async loadConfig({ config, options }) {
    let data = await loadParentConfigs({
      config,
      options,
    });
    // TODO actually relative to template
    let nunjucksConfig = await config.getConfig([".nunjucksrc.js"]);

    let pluginData = {};
    let pluginLocalData = {};
    let remark = await config.getConfig([".remarkrc", ".remarkrc.js"]);
    let rehype = await config.getConfig([".rehyperc", ".rehyperc.js"]);
    let remarkResult = { plugins: [] };
    let rehypeResult = { plugins: [] };
    for (let [cfg, result] of [
      [remark, remarkResult],
      [rehype, rehypeResult],
    ]) {
      if (cfg && cfg.filePath.endsWith(".js") && cfg.contents.static !== true) {
        config.invalidateOnStartup();
      }
      if (cfg?.contents) {
        let content =
          typeof cfg.contents === "function"
            ? cfg.contents({ data: pluginData, localData: pluginLocalData })
            : cfg.contents;
        for (let plugin of content.plugins ?? []) {
          let [name, opts] = Array.isArray(plugin) ? plugin : [plugin, {}];
          let mod;
          if (typeof name === "string") {
            config.addDevDependency({
              resolveFrom: cfg.filePath,
              specifier: name,
            });
            let resolved = await options.packageManager.resolve(
              name,
              cfg.filePath,
              { saveDev: true }
            );
            // $FlowFixMe[unsupported-syntax]
            mod = (await import(resolved.resolved)).default;
          } else {
            mod = name;
          }
          result.plugins.push([mod, opts]);
        }
      }
    }
    return {
      pluginData,
      pluginLocalData,
      data,
      nunjucks: nunjucksConfig?.contents,
      remark: remarkResult,
      rehype: rehypeResult,
    };
  },

  async transform({ asset, config, resolve, options }) {
    let code = await asset.getCode();
    if (!matter.test(code)) {
      return [asset];
    }

    // Passing options to disable internal cache
    let { data: frontmatter, content } = matter(code, {});
    let hasTemplate = config.data.layout != null || frontmatter?.layout != null;
    if (asset.type === "md") {
      content = await mdToHtml(asset.filePath, content, config, hasTemplate);
    }
    frontmatter = {
      ...config.data,
      ...config.pluginData,
      ...frontmatter,
      page: {
        inputPath: path.posix.relative(options.projectRoot, asset.filePath),
      },
    };

    asset.meta.frontmatter = frontmatter ?? {};

    frontmatter = {
      ...config.pluginLocalData,
      ...frontmatter,
    };

    if (hasTemplate) {
      let layoutPath = await resolve(asset.filePath, frontmatter?.layout);
      asset.invalidateOnFileChange(layoutPath);
      let layout = await options.inputFS.readFile(layoutPath, "utf8");
      layout = layout.replace(
        /{% ssg %}([\s\S]*?){% endssg %}/g,
        "{% raw %}<!--ssg $1 ssg-->{% endraw %}"
      );
      content = await renderTemplate({
        layout,
        layoutPath,
        config: config.nunjucks,
        content,
        frontmatter,
      });
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
}) /*: Transformer */);
