const Module = require("module");
const { createRequire } = Module;

// Wrangler 4 bundles whatwg-url@5, and that bundle calls require("punycode").
// Node resolves that to its deprecated builtin and prints DEP0040. The trailing
// slash is the supported way to load the userland package instead.
const userland = createRequire(__filename).resolve("punycode/");

const original = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === "punycode" || id === "node:punycode") {
    return original.call(this, userland);
  }
  return original.apply(this, arguments);
};
