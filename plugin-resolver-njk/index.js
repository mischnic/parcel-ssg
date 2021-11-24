const { Resolver } = require("@parcel/plugin");

module.exports = new Resolver({
  async resolve({ specifier }) {
    if (specifier.startsWith("{{") && specifier.endsWith("}}")) {
      return { isExcluded: true };
    }
  },
});
