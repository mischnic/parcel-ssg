const { Optimizer } = require("@parcel/plugin");
const { blobToString } = require("@parcel/utils");
const nunjucks = require("nunjucks");
const path = require("path");

module.exports = new Optimizer({
  async loadConfig({ config, options }) {
    // TODO should be package root instead of project root??
    return (
      await config.getConfigFrom(
        path.join(path.dirname(config.searchPath), "website/index"),
        [".nunjucksrc.js"]
      )
    )?.contents;
  },

  async optimize({ bundle, bundleGraph, config, contents }) {
    let entry = bundle.getMainEntry();
    if (entry?.meta.frontmatter == null) {
      return {
        contents: contents,
      };
    }

    let collections = {
      all: [],
    };
    for (let b of bundleGraph.getBundles()) {
      if (b.type === "html") {
        let frontmatter = b.getMainEntry().meta.frontmatter;
        if (frontmatter != null && !frontmatter.eleventyExcludeFromCollections) {
          let entry = {
            url: "/" + b.name,
            data: b.getMainEntry().meta.frontmatter,
          };
          collections.all.push(entry);

          let tags = entry.data.tags ?? [];
          let tagList = Array.isArray(tags) ? tags : [tags];
          for (let tag of tagList) {
            let list = collections[tag] ?? (collections[tag] = []);
            list.push(entry);
          }
        }
      }
    }

    for (let list of Object.values(collections)) {
      list.sort((a, b) =>
        a.data?.eleventyNavigation?.order === b.data?.eleventyNavigation?.order
          ? a.url.localeCompare(b.url)
          : a.data?.eleventyNavigation?.order -
            b.data?.eleventyNavigation?.order
      );
    }

    let input = (await blobToString(contents))
      .replace(/<!--ssg/g, "")
      .replace(/ssg-->/g, "");
    let env = nunjucks.configure({ autoescape: true });
    config?.(env);
    let output = env.renderString(input, {
      ...entry.meta.frontmatter,
      page: { ...entry.meta.frontmatter.page, url: "/" + bundle.name },
      collections,
    });

    return {
      contents: output,
    };
  },
});
