// @flow strict-local
"use strict";
const { Namer } = require("@parcel/plugin");

module.exports = (new Namer({
  name({ bundle }) {
    let entry = bundle.getMainEntry();
    if (
      bundle.needsStableName &&
      bundle.type === "html" &&
      entry?.meta.frontmatter?.permalink
    ) {
      // $FlowFixMe[incompatible-type]
      let perma /*: string */ = entry.meta.frontmatter.permalink;
      return perma;
    }
  },
}) /*: Namer */);
