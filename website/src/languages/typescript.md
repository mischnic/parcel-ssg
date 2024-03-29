---
layout: ~/template/layout.njk
title: TypeScript
icon: typescript
eleventyNavigation:
  key: languages-typescript
  title: TypeScript
  order: 4
---

[TypeScript](https://www.typescriptlang.org/) is a typed superset of JavaScript that compiles to JavaScript. Parcel supports TypeScript out of the box without any additional configuration.

## Transpilation

Parcel automatically transpiles TypeScript whenever you use a `.ts` or `.tsx` file. In addition to stripping the types to convert TypeScript to JavaScript, Parcel also compiles modern language features like classes and async await as necessary, [according to your browser targets](/languages/javascript.md#browser-compatibility). It also transpiles [JSX](/languages/javascript.md#jsx) automatically. See the [Transpilation](/languages/javascript.md#transpilation) section of the JavaScript docs for more details.

A `tsconfig.json` file can be used to configure some aspects of the transpilation. Currently, JSX options are supported, as well as the `experimentalDecorators` and `useDefineForClassFields` options. See the [TSConfig reference](https://www.typescriptlang.org/tsconfig) for details.

<sample>
<sample-file name="tsconfig.json">

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "jsxImportSource": "preact"
  }
}
```

</sample-file>
</sample>

### `isolatedModules`

Because Parcel processes each file individually, it implicitly enables the [`isolatedModules`](https://www.typescriptlang.org/tsconfig#isolatedModules) option. This means that some TypeScript features like `const enum` that require cross-file type information to compile will not work. To be warned about usages of these features in your IDE and during type checking, you should enable this option in your `tsconfig.json`.

<sample>
<sample-file name="tsconfig.json">

```json
{
  "compilerOptions": {
    "isolatedModules": true
  }
}
```

</sample-file>
</sample>

### TSC

[TSC](https://www.typescriptlang.org/docs/handbook/compiler-options.html) is the official TypeScript compiler from Microsoft. While Parcel’s default transpiler for TypeScript is much faster than TSC, you may need to use TSC if you are using some configuration in `tsconfig.json` that Parcel doesn't support. In these cases, you can use the `@parcel/transformer-typescript-tsc` plugin by adding it to your `.parcelrc`.

<sample>
<sample-file name=".parcelrc">

```json/3
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.{ts,tsx}": ["@parcel/transformer-typescript-tsc"]
  }
}
```

</sample-file>
</sample>

Even when using TSC, Parcel still processes each TypeScript file individually, so the note about about `isolatedModules` still applies. In addition, some resolution features such as `paths` are not currently supported by Parcel. The TSC transformer also does not perform any type checking ([see below](#type-checking)).

### Babel

You can also choose to use Babel to compile TypeScript. If a Babel config containing `@babel/preset-typescript` is found, Parcel will use it to compile `.ts` and `.tsx` files. Note that this has the same [caveats](https://babeljs.io/docs/en/babel-plugin-transform-typescript#caveats) about isolated modules as above. See [Babel](/languages/javascript.md#babel) in the JavaScript docs for more details.

## Resolution

Parcel does not currently support the `baseUrl` or `paths` options in `tsconfig.json`, which are TypeScript specific resolution extensions. Instead, you may be able to use Parcel's [tilde](/features/dependency-resolution.md#tilde-specifiers) or [absolute](/features/dependency-resolution.md#absolute-specifiers) specifiers to accomplish a similar goal. See [Configuring other tools](/features/dependency-resolution.md#configuring-other-tools) in the dependency resolution docs for information about how to configure TypeScript to support these.

## Generating typings

When building a library, Parcel can extract the types from your entry point and generate a `.d.ts` file. Use the `types` field in `package.json` alongside a target such as `main` or `module` to enable this.

<sample>
<sample-file name="package.json">

```json/3
{
  "source": "src/index.ts",
  "module": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

</sample-file>
</sample>

See [Building a library with Parcel](/getting-started/library.md) for more details.

## Type checking

By default, Parcel does not perform any type checking. The recommended way to type check is by using an editor with TypeScript support (such as VSCode), and using `tsc` to type check your code in CI. You can configure this using npm scripts to run alongside your build, tests, and linting.

<sample>
<sample-file name="package.json">

```json/5
{
  "scripts": {
    "build": "parcel build src/index.ts",
    "test": "jest",
    "lint": "eslint",
    "check": "tsc --noEmit",
    "ci": "yarn build && yarn test && yarn lint && yarn check"
  }
}
```

</sample-file>
</sample>

### Experimental validator plugin

The `@parcel/validator-typescript` plugin is an experimental way to type check within your Parcel build. It runs in the background after bundles are generated. Make sure the `include` option in `tsconfig.json` includes all of your source files.

<sample>
<sample-file name=".parcelrc">

```json/3
{
  "extends": "@parcel/config-default",
  "validators": {
    "*.{ts,tsx}": ["@parcel/validator-typescript"]
  }
}
```

</sample-file>
<sample-file name="tsconfig.json">

```json
{
  "include": ["src/**/*"],
  "compilerOptions": {
    "target": "es2021",
    "strict": true
  }
}
```

</sample-file>
</sample>

<warning>

**Warning**: Parcel validator plugins are experimental and may be unstable.

</warning>
