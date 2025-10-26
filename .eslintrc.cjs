module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.eslint.json',
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
    },
    settings: {
        react: {
            version: 'detect',
        },
        'import/resolver': {
            typescript: {},
        },
        'import/ignore': [
            'node_modules',
            '\\.(coffee|scss|css|less|hbs|svg|json)$',
        ],
    },
    extends: [
        'plugin:react/recommended',
        'standard-with-typescript',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:react-hooks/recommended',
    ],
    plugins: [
        'react-hooks',
        '@tanstack/query',
        'unused-imports',
        '@typescript-eslint',
    ],
    rules: {
        '@tanstack/query/exhaustive-deps': 'error',
        '@tanstack/query/no-rest-destructuring': 'warn',
        '@tanstack/query/stable-query-client': 'error',
        'prefer-promise-reject-errors': 'off',
        'comma-dangle': 'off',
        'unused-imports/no-unused-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
        'object-property-newline': ['error', { allowMultiplePropertiesPerLine: false }],
        'no-multiple-empty-lines': ['error', {
            max: 1,
            maxEOF: 0,
            maxBOF: 0,
        }],
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: 'date-fns/locale',
                        message: 'Import specific locales, that you need in the project. For example, `import from data-fonts/locale/en-US`',
                    },
                    {
                        name: 'moment',
                        message: 'Use \'date-fns\' instead. \'Moment\' is deprecated',
                    },
                    {
                        name: 'date-fns',
                        message: 'Import specific function, that you need in the project. For example `import differenceInDays from \'date-fns\'`',
                    },
                    {
                        name: 'date-fns-tz',
                        message: 'Import specific function, that you need in the project. For example `import utcToZonedTime from \'date-fns-tz/utcToZonedTime\'`',
                    },
                    {
                        name: 'lodash',
                        message: 'Import specific function, that you need in the project. For example `import range from \'lodash/range\'`',
                    },
                    {
                        name: 'react-toastify',
                        message: 'Use "notify" instead"',
                    },
                    {
                        name: '@mui/material/Checkbox',
                        message: 'Use our local Checkbox component instead',
                    },
                    {
                        name: '@mui/material/Tooltip',
                        message: 'Use our local Tooltip component instead (import { Tooltip } from \'@/components/base\')',
                    },
                    {
                        name: '@mui/material',
                        importNames: ['Tooltip'],
                        message: 'Use our local Tooltip component instead (import { Tooltip } from \'@/components/base\')',
                    },
                    {
                        name: '@ag-grid-community/react',
                        importNames: ['AgGridReactProps'],
                        message: 'Use AgGridTableProps instead (import { AgGridTableProps } from \'@/components/tables\')',
                    },
                ],
                patterns: [
                    {
                        group: ['@mui/icons-material/*'],
                        message: 'Use \'Icon\' component instead',
                    },
                    {
                        group: ['../*', '../../*', '../../../*'],
                        message: 'Use absolute imports via @ alias instead of relative imports (e.g., @/utils/... instead of ../...)',
                    },
                ],
            },
        ],
        'import/order': [
            'error',
            {
                warnOnUnassignedImports: true,
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                    'object',
                ],
                pathGroups: [
                    {
                        pattern: 'react',
                        group: 'external',
                        position: 'before',
                    },
                    {
                        pattern: '@/**',
                        group: 'internal',
                        position: 'after',
                    },
                    {
                        pattern: '*.css',
                        group: 'object',
                        patternOptions: { matchBase: true },
                    },
                    {
                        pattern: '*.scss',
                        group: 'object',
                        patternOptions: { matchBase: true },
                    },
                ],
                pathGroupsExcludedImportTypes: [
                    'react',
                ],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],
        'no-debugger': 'error',
        'import/no-cycle': 'off',
        '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
        '@typescript-eslint/consistent-type-imports': ['error', {
            prefer: 'no-type-imports',
        }],
        '@typescript-eslint/no-empty-function': 'warn',
        '@typescript-eslint/return-await': 'off',
        '@typescript-eslint/promise-function-async': 'off',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/indent': ['error', 4],
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'default',
                format: ['PascalCase', 'camelCase'],
            },
            {
                selector: 'enumMember',
                format: ['PascalCase'],
                leadingUnderscore: 'forbid',
                trailingUnderscore: 'forbid',
            },
            {
                selector: 'objectLiteralProperty',
                format: null,
            },
            {
                selector: 'parameter',
                format: null,
            },
            {
                selector: 'typeLike',
                format: ['PascalCase'],
            },
            {
                selector: 'property',
                format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
                leadingUnderscore: 'allow',
            },
            {
                selector: 'variable',
                format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            },
            {
                selector: 'variable',
                format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
                modifiers: ['destructured'],
            },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn',
        '@typescript-eslint/no-confusing-void-expression': 'warn',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
        '@typescript-eslint/require-await': 'warn',
        indent: 'off',
        'react/jsx-closing-bracket-location': ['error', 'line-aligned'],
        'react/jsx-curly-spacing': ['error', {
            when: 'never',
            children: true,
        }],
        'react/jsx-first-prop-new-line': ['error', 'multiline'],
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/jsx-key': 'error',
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react/jsx-boolean-value': 'error',
        'react/jsx-uses-react': 'off',
        'react/jsx-max-props-per-line': [
            'error',
            {
                when: 'multiline',
                maximum: 1,
            },
        ],
        'react/jsx-curly-brace-presence': [
            'error',
            'never',
        ],
        'react/jsx-wrap-multilines': [1, {
            declaration: 'parens-new-line',
            assignment: 'parens-new-line',
            return: 'parens-new-line',
            arrow: 'parens-new-line',
            condition: 'parens-new-line',
            logical: 'parens-new-line',
            prop: 'parens-new-line',
        }],
        'react/jsx-tag-spacing': ['error', {
            closingSlash: 'never',
            beforeSelfClosing: 'never',
            afterOpening: 'never',
            beforeClosing: 'never',
        }],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'react/self-closing-comp': ['error', {
            component: true,
        }],
        'no-sequences': 'off',
        'multiline-ternary': 'off',
        curly: 'warn',
        'object-curly-spacing': ['error', 'always'],
        'brace-style': 'error',
        'prefer-const': 'error',
        'eol-last': ['error', 'always'],
        quotes: ['error', 'single'],
        'jsx-quotes': ['error', 'prefer-single'],
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'off',
        'no-new': 'off',
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-restricted-globals': [
            'error',
            {
                name: 'setInterval',
                message: 'Please use "setIntervalUntilAuthenticated" instead',
            },
        ],
        'no-restricted-properties': ['error', {
            object: 'React',
            property: 'useState',
            message: 'You can\'t take hooks (or anything else) from React.*',
        }, {
            object: 'React',
            property: 'useEffect',
            message: 'You can\'t take hooks (or anything else) from React.*',
        }, {
            object: 'React',
            property: 'FC',
            message: 'You can\'t take hooks (or anything else) from React.*',
        }, {
            object: 'React',
            property: 'useRef',
            message: 'You can\'t take hooks (or anything else) from React.*',
        }, {
            object: 'toast',
            property: 'error',
            message: 'Use "notify" instead"',
        },
        ],
    },
    overrides: [
        {
            files: [
                '**/*.d.ts',
            ],
            rules: {
                '@typescript-eslint/triple-slash-reference': 'off',
            },
        },
        {
            files: [
                '**/*.js',
            ],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
        {
            files: [
                'src/db/types/**/*.ts',
                'src/db/constants/**/*.ts',
            ],
            rules: {
                '@typescript-eslint/naming-convention': 'off',
            },
        },
    ],
}

