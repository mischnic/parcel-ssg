// @flow
/*::
import type {JSONObject} from '@parcel/types';

type Frontmatter = {|
  tags: string | Array<string>,
  layout?: string,
  title: string,
  order?: number,
  permalink?: string,
  page: {| inputPath: string |},
  eleventyExcludeFromCollections?: boolean,
  eleventyNavigation?: {| order?: number |}
|};

*/

const {Optimizer} = require('@parcel/plugin');
const {blobToString} = require('@parcel/utils');
const nunjucks = require('nunjucks');
const nullthrows = require('nullthrows');
const path = require('path');

module.exports = (new Optimizer({
  async loadConfig({config}) {
    // TODO should be package root instead of project root??
    return (
      await config.getConfigFrom(
        path.join(path.dirname(config.searchPath), 'website/index'),
        ['.nunjucksrc.js'],
      )
    )?.contents;
  },
  loadBundleConfig({bundle, bundleGraph, config}) {
    let entry = bundle.getMainEntry();
    if (entry?.meta.frontmatter == null) {
      return;
    }

    config.invalidateOnBuild();

    let collections = {
      all: [],
    };
    for (let b of bundleGraph.getBundles()) {
      if (b.type === 'html') {
        // $FlowFixMe
        let frontmatter /*: Frontmatter | void */ = nullthrows(b.getMainEntry())
          .meta.frontmatter;
        if (
          frontmatter != null &&
          !frontmatter.eleventyExcludeFromCollections
        ) {
          let entry = {
            url: '/' + b.name,
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
      collections,
    )) {
      list.sort((a, b) =>
        a.data?.eleventyNavigation?.order === b.data?.eleventyNavigation?.order
          ? a.url.localeCompare(b.url)
          : (a.data?.eleventyNavigation?.order ?? 0) -
            (b.data?.eleventyNavigation?.order ?? 0),
      );
    }

    return collections;
  },

  async optimize({bundle, config, bundleConfig, contents}) {
    let entry = bundle.getMainEntry();
    if (entry?.meta.frontmatter == null) {
      return {
        contents: contents,
      };
    }

    let input = (await blobToString(contents))
      .replace(/<!--ssg/g, '')
      .replace(/ssg-->/g, '');
    let env = nunjucks.configure({autoescape: true});
    config?.(env);
    let output = env.renderString(input, {
      // $FlowFixMe
      ...entry.meta.frontmatter,
      // $FlowFixMe
      page: {...entry.meta.frontmatter.page, url: '/' + bundle.name},
      collections: bundleConfig,
    });

    return {
      contents: output,
    };
  },
}) /*: Optimizer*/);
