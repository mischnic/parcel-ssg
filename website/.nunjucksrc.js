module.exports = (env) => {
  env.addFilter("excerpt", function (content) {
    let excerpt = null;

    // The start and end separators to try and match to extract the excerpt
    const separatorsList = [
      { start: "<!-- Excerpt Start -->", end: "<!-- Excerpt End -->" },
      { start: "<p>", end: "</p>" },
    ];

    separatorsList.some((separators) => {
      const startPosition = content.indexOf(separators.start);
      const endPosition = content.indexOf(separators.end);

      if (startPosition !== -1 && endPosition !== -1) {
        excerpt = content
          .substring(startPosition + separators.start.length, endPosition)
          .trim();
        return true; // Exit out of array loop on first match
      }
    });

    return excerpt;
  });

  env.addFilter("toISODate", function (date) {
    return date.toISOString().replace(/T.*/, "");
  });
  env.addFilter("pageUrl", function (page) {
    return page.url;
  });
  env.addFilter("sortDate", function (data) {
    return [...data].sort((a, b) => b.data.date - a.data.date);
  });

  env.addFilter("eleventyNavigation", function (coll) {
    if (!coll) return coll;
    return coll.map((c) => ({
      url: c.url,
      title: c.data.eleventyNavigation?.title ?? c.data.title,
    }));
  });

  env.addFilter("url", (u) => u);

  env.addFilter("headingID", function (tag) {
    return tag.toLowerCase().replace(/[^a-z]/gi, "") + "-heading";
  });
};
