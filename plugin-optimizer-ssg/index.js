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

    let collections = {
      all: [],
    };
    for (let b of bundleGraph.getBundles()) {
      if (b.type === "html" && b.getMainEntry().meta.frontmatter != null) {
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

    for (let list of Object.values(collections)) {
      list.sort((a, b) =>
        a.data.order === b.data.order
          ? a.url.localeCompare(b.url)
          : a.data.order - b.data.order
      );
    }

    let input = (await blobToString(contents))
      .replace(/<!--ssg/g, "")
      .replace(/ssg-->/g, "");
    let env = nunjucks.configure({ autoescape: true });
    let output = env.renderString(input, {
      ...entry.meta.frontmatter,
      collections,
    });

    return {
      contents: output,
    };
  },
});
