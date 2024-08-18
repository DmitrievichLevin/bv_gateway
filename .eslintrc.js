module.exports = {
  env: {
    node: true,
  },
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  files: ['*.ts', '*.tsx'],
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    "eslint:recommended", "plugin:@typescript-eslint/recommended"
  ],
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/max-classes-per-file': 0,
    '@typescript-eslint/indent': 0, // off because this package does not work
    'arrow-parens': 0,
    'comma-dangle': 0,
    'import/no-extraneous-dependencies': ['error', {'devDependencies': true}],
    'import/no-useless-path-segments': ['error', {
      noUselessIndex: true,
    }],
    'import/prefer-default-export': 0,
    'class-methods-use-this': 0,
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '_' }],
    'space-before-function-paren': 0,
    radix: 0,
  },
};

