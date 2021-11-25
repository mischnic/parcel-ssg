## Not implemented

- EASY: running custom markdown plugins should be straight forward to add
- TBD: somehow make it easy to use a different template language (ejs, mdx, https://www.11ty.dev/docs/languages/)

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

This is a rather ugly hack (though this distinction of local vs global template does make sense).

### Relative dependencies

The two stage approach solves the problem that two bundles (markdown, template) that both have dependencies would have to be merged in a packager/optimizer.

The downside is that the template is inlined into the markdown, so relative URLs cannot be used in the template.
This isn't ideal but not really a dealbreaker (I think?)
