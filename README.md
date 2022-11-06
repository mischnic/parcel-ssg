## TODO

- parse and replace `{% ssg %}` properly, not with a regex

ecosystem problems:

- remark-prism doesnt's support marking specific lines

"Long term":

- using different templating languages (ejs, mdx, https://www.11ty.dev/docs/languages/) would require different transformers and/or optimizers

## Problems

### Blocker: A page that lists the contents of all pages

= generating an RSS feed

A optimizer doesn't have access to other packager's outputs.

### `title: <img src="icon.svg"> Foo`

**Workaround**: iconsets

Adding that title in the optimizer when generating the hashmap doesn't work because the dependency is never collected.

But furthermore, even if this were added as a dependency and replaced with `title: <img src="238239ae83f"> Foo`, reading this information from a different bundle and inserting it into "this" bundle (from the optimizer's perspective) would mean that a bundle contains a dependency hash reference to a depenedency that is not part of the bundle according to the bundle graph. I assume this breaks caching at the very least, if it does work at all right now.

### Relative dependencies

The two stage approach solves the problem that two bundles (markdown, template) that both have dependencies would have to be merged in a packager/optimizer.

The downside is that the template is inlined into the markdown, so relative URLs cannot be used in the template. This isn't ideal but not really a dealbreaker.

All HTML elements coming from the Markdown content are marked with a `data-parcel-element-content` attribute.

Then after instantiating the template, all elements without `data-parcel-element-content` are re-resolved to be relative to `asset.filePath` instead.

This currently only works for `href` and `src`. In theory, it should reuse the detection visitor from the HTML transformer to e.g. handle `srcset`.

## Reference

Possible config files: `.remark[.js]`, `.rehype[.js]`, `.nunjucksrc.js`

Eleventy-style data files are `_data.json` (all data files in parent directories are merged into `asset.meta.frontmatter`)

Iconsets are specified in `.iconset.json`.

### Templates

Available properties in the local template:

- ...everything specified in parent `_data.json` files
- ...everything specified in frontmatter
- ...everything generated in plugins as `data`
- ...everything generated in plugins as `localData`
- `page.inputPath`: relative(project root, this)
- `content`: the markdown file processed with remark and rehype
- `iconset`: An object mapping icon names from the config file to the dependency specifier for this asset.

Available properties in the global template (in `{% raw %}<!-- ssg ... ssg-->{% endraw %}`):

- ...everything specified in parent `_data.json` files
- ...everything specified in frontmatter
- ...everything generated in plugins as `data`
- `page.inputPath`: relative(project root, this)
- `page.url`: absolute bundle url
- `collections.*`: list of generated pages `Array<{ url: string, data: mixed }>` (`data` is the frontmatter)

### Two stages

1. markdown + template -> HTML in transformer
2. to use global information (e.g. list of pages), wrap like this

```
        {% ssg %}
          {%- for page in pages -%}
          <li>
            <a href="{{ page.url }}">{{ page.data.title }}</a>
          </li>
          {%- endfor -%}
        {% endssg %}
```

or verbosely

```
        {% raw %}<!--ssg
          {%- for page in pages -%}
          <li>
            <a href="{{ page.url }}">{{ page.data.title }}</a>
          </li>
          {%- endfor -%}
        ssg-->{% endraw %}
```

which just gets passed through the markdown and html transformer. The optimizer then removes the comment and evaluates the template inside.

But the distinction of local vs global template does make sense. The local one can add arbitrary dependencies to other files, while the global one
has access to the page list.
