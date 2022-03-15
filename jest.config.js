/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    rootDir: '.',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    testMatch: ['**/__tests__/**/*.spec.+(ts|tsx|js)'],
};
