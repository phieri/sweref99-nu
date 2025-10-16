module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/*.test.ts'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts'
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: {
				target: 'ES2020',
				module: 'commonjs',
				lib: ['ES2020', 'DOM', 'DOM.Iterable'],
				strict: true,
				esModuleInterop: true,
				skipLibCheck: true,
				isolatedModules: true
			}
		}]
	},
	// Exclude src directory from test compilation
	testPathIgnorePatterns: ['/node_modules/', '/src/']
};
