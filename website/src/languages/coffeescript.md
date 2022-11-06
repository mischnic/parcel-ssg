---
layout: ~/template/layout.njk
title: CoffeeScript
icon: coffeescript
iconClass: dark-invert
eleventyNavigation:
  key: languages-coffee
  title: CoffeeScript
  order: 5
---

[CoffeeScript](https://coffeescript.org) is a language that transpiles to JavaScript, which allows you to use a shorter syntax and other features like [the existential operator](https://coffeescript.org/#existential-operator), [shorter array-splicing syntax](https://coffeescript.org/#slices), [block regular expressions](https://coffeescript.org/#regexes) and more.

Parcel supports CoffeeScript automatically using the `@parcel/transformer-coffeescript` plugin. When a `.coffee` file is detected, it will be installed into your project automatically.

CoffeeScript is compiled to JavaScript and processed as described in the [JavaScript docs](/languages/javascript.md).

## Example usage

<sample>
<sample-file name="index.html">

```html
<script type="module" src="app.coffee"></script>
```

</sample-file>
<sample-file name="app.coffee">

```coffeescript
console.log 'Hello world!'
```

</sample-file>
</sample>

### URL dependencies

In JavaScript files, [URL dependencies](/languages/javascript.md#url-dependencies) can be created using the `URL` constructor combined with `import.meta.url`. This can be used to reference URLs such as images, [workers](/languages/javascript.md#workers), [service workers](/languages/javascript.md#service-workers), and more.

CoffeeScript does not currently support `import.meta`. Instead, you can use the CommonJS `__filename` variable with the `file:` prefix to convert it to a URL. For example, here's how you could create a worker in CoffeeScript:

```coffeescript
new Worker new URL('worker.js', 'file:' + __filename),
  type: 'module'
```

The same goes for other types of dependencies like images:

```coffeescript
img = document.createElement 'img'
img.src = new URL 'hero.jpg', 'file:' + __filename
document.body.appendChild img
```
