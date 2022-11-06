---
layout: ~/template/layout.njk
title: YAML
eleventyNavigation:
  key: languages-yaml
  title: <img src="/assets/lang-icons/yaml.svg" class="dark-invert" alt=""/> YAML
  order: 13
---

Parcel supports importing YAML files from JavaScript using the `@parcel/transformer-yaml` plugin. When a `.yaml` file is detected, it will be installed into your project automatically.

## Example usage

<sample>
<sample-file name="app.js">

```js
import data from './data.yaml';
console.log(data.hello[0]);
// => "world"
```

</sample-file>
<sample-file name="data.yaml">

```yaml
hello:
  - world
  - computer
```

</sample-file>
</sample>
