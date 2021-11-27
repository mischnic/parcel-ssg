---
title: Raw
order: 3
---

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>{{ title }}</title>
  </head>
  <body>
    <nav>
      <ul>
        <!--ssg 
          {%- for page in pages -%}
          <li>
            <a href="{{ page.url }}">{{ page.data.title }}</a>
          </li>
          {%- endfor -%}
        ssg-->
      </ul>
    </nav>
    <main>Some raw HTML</main>
    <a href="/">Back</a>
  </body>
</html>
