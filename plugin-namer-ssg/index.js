"use strict";
const { Namer } = require("@parcel/plugin");

module.exports = new Namer({
  name({ bundle }) {
    let entry = bundle.getMainEntry();
    if (
      bundle.needsStableName &&
      bundle.type === "html" &&
      entry?.meta.frontmatter?.permalink
    ) {
      return entry.meta.frontmatter.permalink;
    }

    // TODO move into home/index.html frontmatter
    if (
      bundle.needsStableName &&
      entry?.filePath.endsWith("src/home/index.html")
    ) {
      return "index.html";
    }
  },
});
