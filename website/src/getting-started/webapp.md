---
layout: ~/template/layout.njk
title: Building a web app with Parcel
description: A getting started guide walking through how to setup a project with Parcel.
eleventyNavigation:
  key: getting-started-webapp
  title: 🌐 Web app
  order: 1
---

## Installation

Before we get started, you'll need to install Node and Yarn or npm, and create a directory for your project. Then, install Parcel into your app using Yarn:

```shell
yarn add --dev parcel
```

Or when using npm run:

```shell
npm install --save-dev parcel
```

## Project setup

Now that Parcel is installed, let’s create some source files for our app. Parcel accepts any type of file as an entry point, but an HTML file is a good place to start. Parcel will follow all of your dependencies from there to build your app.

<sample>
<sample-file name="src/index.html">

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>My First Parcel App</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>
```

</sample-file>
</sample>

Parcel has a development server built in, which will automatically rebuild your app as you make changes. To start it, run the `parcel` CLI pointing to your entry file:

```shell
yarn parcel src/index.html
```

Or when using npm run:

```shell
npx parcel src/index.html
```

Now open [http://localhost:1234/](http://localhost:1234/) in your browser to see the HTML file you created above.

Next, you can start adding dependencies to your HTML file, such as a JavaScript or CSS file. For example, you could create a `styles.css` file and reference it from your `index.html` file with a `<link>` tag, and an `app.js` file referenced with a `<script>` tag.

<sample>
<sample-file name="src/styles.css">

```css
h1 {
  color: hotpink;
  font-family: cursive;
}
```

</sample-file>
<sample-file name="src/app.js">

```javascript
console.log('Hello world!');
```

</sample-file>
<sample-file name="src/index.html">

```html/5-6
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>My First Parcel App</title>
    <link rel="stylesheet" href="styles.css" />
    <script type="module" src="app.js"></script>
  </head>
  <body>
    <h1>Hello, World!</h1>
  </body>
</html>
```

</sample-file>
</sample>

As you make changes, you should see your app automatically update in the browser without even refreshing the page!

In this example, we’ve shown how to use vanilla HTML, CSS, and JavaScript, but Parcel also works with many common web frameworks and languages like [React](/recipes/react.md) and [TypeScript](/languages/typescript.md) out of the box. Check out the Recipes and Languages sections of the docs to learn more.

## Package scripts

So far, we’ve been running the `parcel` CLI directly, but it can be useful to create some scripts in your `package.json` file to make this easier. We'll also setup a script to build your app for [production](/features/production.md) using the `parcel build` command. Finally, you can also declare your [entries](/features/targets.md#entries) in a single place using the `source` field so you don't need to duplicate them in each `parcel` command.

<sample>
<sample-file name="package.json">

```json
{
  "name": "my-project",
  "source": "src/index.html",
  "scripts": {
    "start": "parcel",
    "build": "parcel build"
  },
  "devDependencies": {
    "parcel": "latest"
  }
}
```

</sample-file>
</sample>

Now you can run `yarn build` to build your project for production and `yarn start` to start the development server.

## Declaring browser targets

By default Parcel does not perform any code transpilation. This means that if you write your code using modern language features, that’s what Parcel will output. You can declare your app’s supported browsers using the `browserslist` field. When this field is declared, Parcel will transpile your code accordingly to ensure compatibility with your supported browsers.

<sample>
<sample-file name="package.json">

```json/3
{
  "name": "my-project",
  "source": "src/index.html",
  "browserslist": "> 0.5%, last 2 versions, not dead",
  "scripts": {
    "start": "parcel",
    "build": "parcel build"
  },
  "devDependencies": {
    "parcel": "latest"
  }
}
```

</sample-file>
</sample>

You can learn more about targets, as well as Parcel’s automatic support for differential bundling on the [Targets](/features/targets.md) page.

## Next steps

Now that you’ve set up your project, you're ready to learn about some more advanced features of Parcel. Check out the documentation about [development](/features/development.md) and [production](/features/production.md), and see the Recipes and Languages sections for more in-depth guides using popular web frameworks and tools.

