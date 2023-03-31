module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaVersion: 2017,
    sourceType: "module",
  },
  rules: {
    indent: ['error', 2, { "SwitchCase": 1 }],
    "linebreak-style": ["error", "unix"],
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { vars: "all", args: "after-used", ignoreRestSiblings: false },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/explicit-function-return-type': ['error'],
    "no-empty": "warn",

    'no-unused-vars': 'off',
    '@typescript-eslint/class-literal-property-style': [
      'error',
      'fields',
    ],
    '@typescript-eslint/prefer-for-of': ['error'],
    '@typescript-eslint/semi': ['error'],
    '@typescript-eslint/member-delimiter-style': ['error', {
      "multiline": { "delimiter": "comma", "requireLast": true },
      "singleline": { "delimiter": "comma", "requireLast": false },
      "multilineDetection": "last-member"
    }],
    'arrow-parens': ['error', 'as-needed'],
    'arrow-body-style': ['error', 'as-needed'],
    'no-confusing-arrow': ['error'],
    'arrow-spacing': ['error', { "before": true, "after": true }],
    'brace-style': ['error', '1tbs'],
    'object-curly-spacing': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never', { 'objectsInArrays': false }],
    'computed-property-spacing': ['error'],
    'space-in-parens': ['error'],
    'func-call-spacing': ['error'],
    'no-trailing-spaces': ['error'],
    'no-multi-spaces': ['error'],
    'block-spacing': ['error'],
    'key-spacing': ['error'],
    'keyword-spacing': ['error'],
    'no-eq-null': ['error'],
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowNullableString: true,
      allowNullableNumber: true,
      allowNullableBoolean: true
    }],
    'quotes': ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: false
    }],
  },
};