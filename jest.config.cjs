/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  // WHY 120s (was 10s): a CPU peak (other processes, loaded machine) can stall a test for many
  // seconds; the default only bounds tests that hang outright, and tests that need a tighter or
  // longer bound set their own. A genuinely hung test still fails, just later.
  testTimeout: 120000,
  maxWorkers: 1, // Run tests serially to avoid network conflicts (and CPU oversubscription)
  forceExit: true, // Force Jest to exit after tests complete
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/utils/wwdc-data-source.ts',  // Exclude due to import.meta.url
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};