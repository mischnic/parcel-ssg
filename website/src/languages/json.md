---
layout: ~/template/layout.njk
title: JSON
icon: json
iconClass: dark-invert
eleventyNavigation:
  key: languages-json
  title: JSON
  order: 11
---

Parcel supports importing JSON and [JSON5](https://json5.org) files into JavaScript out of the box.

## Example usage

<sample>
<sample-file name="app.js">

```js
import data from './data.json';
console.log(data.hello[0]);
// => "world"
```

</sample-file>
<sample-file name="data.json">

```json
{
  "hello": [
    "world",
    "computer"
  ]
}
```

</sample-file>
</sample>
