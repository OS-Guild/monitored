module.exports = {
    rootDir: '.',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
        },
    },
    testMatch: ['__tests__/**/*.spec.+(ts|tsx|js)'],
};
