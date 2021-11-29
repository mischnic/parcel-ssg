## TODO

- `title: <img src="icon.svg"> Foo` doesn't work because its only inserted in the optimizer
- parse `{% ssg %}` properly, not with a regex

ecosystem problems:

- remark-prism doesnt's support marking specific lines

"Long term":

- using different templating languages (ejs, mdx, https://www.11ty.dev/docs/languages/) would require different transformers and/or optimizers

## Problems

### Packagers/Optimizers don't invalidate when bundlegraph changes

So adding a page or changing frontmatter that is used in the second template doesn't update the nav bar.

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

which just gets passed through the markdown and html transformer. The optimizer then removes the comment and evaluates the template inside.

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

- ...everything specified in parent `_data.json` files
- ...everything specified in frontmatter
- ...everything generated in plugins
- `page.inputPath`: relative(project root, this)
- `content`: the markdown file processed with remark and rehype

Available properties in the global template (in `{% raw %}<!-- ssg ... ssg-->{% endraw %}`):

- ...everything specified in frontmatter
- `page.url`: absolute bundle url
- `collections.*`: list of generated pages `Array<{ url: string, data: mixed }>` (`data` is the frontmatter)
