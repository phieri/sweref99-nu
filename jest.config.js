module.exports = {
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
		'^.+\\.(ts|tsx)$': 'babel-jest'
	},
	// Exclude src directory from test compilation
	testPathIgnorePatterns: ['/node_modules/', '/src/']
};
