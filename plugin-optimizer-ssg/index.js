// @flow strict-local
"use strict";
/*::
import type { JSONObject } from "@parcel/types";
import type { Frontmatter } from "../types.js";
*/

const { Optimizer } = require("@parcel/plugin");
const { blobToString, replaceURLReferences } = require("@parcel/utils");
const nunjucks = require("nunjucks");
const nullthrows = require("nullthrows");
const path = require("path");
const { hashString } = require("@parcel/hash");

module.exports = (new Optimizer({
  async loadConfig({ config }) {
    // TODO should be package root instead of project root??
    return (
      await config.getConfigFrom(
        path.join(path.dirname(config.searchPath), "website/index"),
        [".nunjucksrc.js"]
      )
    )?.contents;
  },
  loadBundleConfig({ bundle, bundleGraph, config }) {
    let entry = bundle.getMainEntry();
    if (entry?.meta.frontmatter == null) {
      return;
    }

    config.invalidateOnBuild();

    let collections = {
      all: [],
    };
    for (let b of bundleGraph.getBundles()) {
      if (b.type === "html") {
        // $FlowFixMe
        let frontmatter /*: Frontmatter | void */ = nullthrows(b.getMainEntry())
          .meta.frontmatter;
        if (
          frontmatter != null &&
          !frontmatter.eleventyExcludeFromCollections
        ) {
          let entry = {
            url: "/" + b.name,
            data: frontmatter,
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

    // $FlowFixMe
    for (let list /*: Array<{|data: Frontmatter, url: string|}> */ of Object.values(
      collections
    )) {
      list.sort((a, b) => {
        let aOrder = a.data?.eleventyNavigation?.order;
        let bOrder = b.data?.eleventyNavigation?.order;
        return aOrder == null || bOrder == null || aOrder == bOrder
          ? a.url.localeCompare(b.url)
          : aOrder - bOrder;
      });
    }

    let result = Object.fromEntries(
      Object.entries(collections).sort(([a], [b]) => a.localeCompare(b))
    );
    // Workaround for V8 serialize being non-deterministic
    config.setCacheKey(hashString(JSON.stringify(result)));
    return result;
  },

  async optimize({ bundle, bundleGraph, config, bundleConfig, contents }) {
    let entry = bundle.getMainEntry();
    if (entry?.meta.frontmatter == null) {
      return {
        contents,
      };
    }

    // $FlowFixMe
    let frontmatter /*: Frontmatter*/ = entry.meta.frontmatter;

    let input = (await blobToString(contents))
      .replace(/<!--ssg/g, "")
      .replace(/ssg-->/g, "")
      // TODO minified CSS can contain this
      .replace(/{#/g, "{ #");
    let env = new nunjucks.Environment([], { autoescape: true });
    config?.(env);
    let output = env.renderString(
      input,
      {
        // $FlowFixMe
        ...frontmatter,
        iconset: entry.meta.iconset,
        // $FlowFixMe
        page: { ...frontmatter.page, url: "/" + bundle.name },
        collections: bundleConfig,
      },
      { path: frontmatter.page.inputPath }
    );

    // The layout can reinsert some dependency specifiers (e.g. iconset), so re-replace them.
    return replaceURLReferences({
      bundle,
      bundleGraph,
      contents: output,
      relative: false,
      getReplacement: (contents) => contents.replace(/"/g, "&quot;"),
    });
  },
}) /*: Optimizer*/);
