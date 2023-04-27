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
    testMatch: ['**/__tests__/**/LambdaEmbeddedMetricsPlugin.spec.+(ts|tsx|js)'],
    testTimeout: 10000,
    verbose: true,
};
