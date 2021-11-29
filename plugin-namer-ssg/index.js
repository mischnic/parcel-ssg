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
  },
});
