export default {
  extends: ["stylelint-config-standard"],
  rules: {
    "declaration-no-important": true,
    "no-duplicate-selectors": true,
    "selector-max-id": 0,
    "selector-max-specificity": "0,4,0",
    "selector-class-pattern": "^(?!.*(?:fix|patch|temp|final|new))[a-z][a-z0-9]*(?:-[a-z0-9]+)*$",
    "color-no-invalid-hex": true,
    "declaration-block-single-line-max-declarations": null,
    "no-descending-specificity": null,
    "media-feature-range-notation": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "value-keyword-case": null
  }
};
