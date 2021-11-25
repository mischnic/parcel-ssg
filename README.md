The example project is in "src".

## Not implemented

- somehow make it easy to use a different template language (ejs, mdx, https://www.11ty.dev/docs/languages/)
  - these would output a HTML asset (and set `meta.frontmatter`): a markdown (remark and potentially also rehype), an mdx transformer
  - then a transformer to merge the content the template from `meta.frontmatter.layout`
  - (continue with the HTML transformer)
  - PROBLEM: between these two transformers, it would automatically switch to the HTML pipeline. so the second transformer has to be "inlined" into the first one. So not composing plugins but extending them.

## Problems

### Two stages

1. markdown + template -> HTML in transformer
2. to use global information (e.g. list of pages), wrap like this

```
        {% raw %}<!--ssg
          {%- for page in pages -%}
          <li>
            <a href="{{ page.url }}">{{ page.data.title }}</a>
          </li>
          {%- endfor -%}
        ssg-->{% endraw %}
```

which just gets passed through the markdown and html transformer. The packager then removes the comment and evaluates the template inside.

This is some very ugly syntax.

But the distinction of local vs global template does make sense. The local one can add arbitrary dependencies to other files, while the global one
has access to the page list.

### Relative dependencies

The two stage approach solves the problem that two bundles (markdown, template) that both have dependencies would have to be merged in a packager/optimizer.

The downside is that the template is inlined into the markdown, so relative URLs cannot be used in the template. This isn't ideal but not really a dealbreaker.

One solution would be to mark all HTML elements that come from the markdown file, and then in the final HTML (after instantiating the template with the content)
rewrite all `<img src>`/`<link href>`/... (this needs to be the same list as in the HTML transformer) specifiers to point to the correct file (and removing the node marking again).
The marking could work via a `data-parcel-element-content` attribute.

If the template uses something from the frontmatter that references a template, the user would have to take care of re-rewriting the specifier. But the most
common case of specifying styles and scripts in the template would work correctly and without any special syntax.

## Templates

Available properties in the local template:

- ...everything specified in frontmatter
- `content`: the markdown file processed with remark and rehype

Available properties in the global template (in `{% raw %}<!-- ssg ... ssg-->{% endraw %}`):

- ...everything specified in frontmatter
- `pages`: list of generated pages `Array<{ url: string, data: mixed }>` (`data` is the frontmatter)
