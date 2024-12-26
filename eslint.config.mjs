import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [{
  files: [
    "tests/*.mjs",
    "index.mjs",
  ],
  languageOptions: {
    sourceType: "module",
  },
  rules: {
    ...pluginJs.configs.recommended.rules,
    "no-undef"            : "error",
    "quotes"              : ["error", "double"],
    "semi"                : ["error", "always"],
    "no-var"              : "error",
    "eqeqeq"              : ["error", "always"],
    "no-trailing-spaces"  : "error",
    "comma-dangle"        : ["error", "always-multiline"],
    "no-duplicate-imports": "error",
    "prefer-const"        : "error",
    "no-unused-vars"      : ["error"],
    "no-debugger"         : "error",
    "no-alert"            : "error",
    "no-eval"             : "error",
    "no-implied-eval"     : "error",
    "no-with"             : "error",
    "no-shadow"           : "error",
    "no-use-before-define": ["error", { "functions": false, "classes": true, "variables": true }],
  },
}];
