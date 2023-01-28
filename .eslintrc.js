const { ESLint } = require("eslint")


/**
 * @type {ESLint.ConfigData}
 */
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'standard-with-typescript'
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json']
  },
  rules: {
    // quotes: ['error', 'single']
    // 强制两个空格缩进
    indent: ['error', 2],

    // 允许函数不带返回值，默认返回void
    '@typescript-eslint/explicit-function-return-type':0,

    // 允许this的别名，即 let self=this这种写法
    "@typescript-eslint/no-this-alias": 0,

    // 可以对非空值进行断言
    "@typescript-eslint/no-non-null-assertion": 0,

    // 允许非boolean类型的if判断
    "@typescript-eslint/strict-boolean-expressions":0,

    // 允许`xx as Type`这种写法
    "@typescript-eslint/consistent-type-assertions":0 
  }
}
