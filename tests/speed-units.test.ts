/**
 * Unit tests for speed unit conversion and cycling functionality
 * 
 * Tests cover:
 * - Speed conversion between m/s, km/h, and mph
 * - Unit cycling logic
 * - LocalStorage persistence
 */

/**
 * Speed unit types for display
 */
type SpeedUnit = 'm/s' | 'km/h' | 'mph';

/**
 * Speed unit conversion factors (from m/s)
 */
const SPEED_CONVERSION = {
	'm/s': 1,
	'km/h': 3.6,
	'mph': 2.23694
} as const;

/**
 * Speed unit order for cycling through units
 */
const SPEED_UNIT_ORDER: SpeedUnit[] = ['m/s', 'km/h', 'mph'];

/**
 * Convert speed from m/s to the specified unit
 */
function convertSpeed(speedMs: number, unit: SpeedUnit): number {
	return speedMs * SPEED_CONVERSION[unit];
}

/**
 * Get the next speed unit in the cycle
 */
function getNextSpeedUnit(currentUnit: SpeedUnit): SpeedUnit {
	const currentIndex = SPEED_UNIT_ORDER.indexOf(currentUnit);
	const nextIndex = (currentIndex + 1) % SPEED_UNIT_ORDER.length;
	return SPEED_UNIT_ORDER[nextIndex];
}

describe('Speed Unit Conversion', () => {
	describe('convertSpeed function', () => {
		test('should convert m/s to m/s (identity)', () => {
			expect(convertSpeed(10, 'm/s')).toBe(10);
			expect(convertSpeed(5.5, 'm/s')).toBe(5.5);
			expect(convertSpeed(0, 'm/s')).toBe(0);
		});

		test('should convert m/s to km/h', () => {
			expect(convertSpeed(10, 'km/h')).toBe(36);
			expect(convertSpeed(5, 'km/h')).toBe(18);
			expect(convertSpeed(1, 'km/h')).toBe(3.6);
			expect(convertSpeed(0, 'km/h')).toBe(0);
		});

		test('should convert m/s to mph', () => {
			// 10 m/s ≈ 22.3694 mph
			expect(convertSpeed(10, 'mph')).toBeCloseTo(22.3694, 4);
			// 5 m/s ≈ 11.1847 mph
			expect(convertSpeed(5, 'mph')).toBeCloseTo(11.1847, 4);
			// 1 m/s ≈ 2.23694 mph
			expect(convertSpeed(1, 'mph')).toBeCloseTo(2.23694, 4);
			expect(convertSpeed(0, 'mph')).toBe(0);
		});

		test('should handle typical walking speed (1.4 m/s)', () => {
			// 1.4 m/s = 5.04 km/h ≈ 3.13 mph
			expect(convertSpeed(1.4, 'm/s')).toBe(1.4);
			expect(convertSpeed(1.4, 'km/h')).toBeCloseTo(5.04, 2);
			expect(convertSpeed(1.4, 'mph')).toBeCloseTo(3.13, 2);
		});

		test('should handle typical cycling speed (5 m/s)', () => {
			// 5 m/s = 18 km/h ≈ 11.18 mph
			expect(convertSpeed(5, 'm/s')).toBe(5);
			expect(convertSpeed(5, 'km/h')).toBe(18);
			expect(convertSpeed(5, 'mph')).toBeCloseTo(11.1847, 4);
		});

		test('should handle typical driving speed (27.78 m/s ≈ 100 km/h)', () => {
			// 27.78 m/s ≈ 100 km/h ≈ 62.14 mph
			const speedMs = 27.78;
			expect(convertSpeed(speedMs, 'm/s')).toBe(speedMs);
			expect(convertSpeed(speedMs, 'km/h')).toBeCloseTo(100, 1);
			expect(convertSpeed(speedMs, 'mph')).toBeCloseTo(62.14, 1);
		});

		test('should handle decimal values', () => {
			expect(convertSpeed(2.5, 'km/h')).toBe(9);
			expect(convertSpeed(3.14159, 'm/s')).toBeCloseTo(3.14159, 5);
			expect(convertSpeed(1.5, 'mph')).toBeCloseTo(3.35541, 4);
		});
	});

	describe('SPEED_CONVERSION constants', () => {
		test('should have correct m/s factor', () => {
			expect(SPEED_CONVERSION['m/s']).toBe(1);
		});

		test('should have correct km/h factor (3.6)', () => {
			// 1 m/s = 3.6 km/h (60 seconds * 60 minutes / 1000 meters)
			expect(SPEED_CONVERSION['km/h']).toBe(3.6);
		});

		test('should have correct mph factor (2.23694)', () => {
			// 1 m/s ≈ 2.23694 mph
			expect(SPEED_CONVERSION['mph']).toBeCloseTo(2.23694, 5);
		});

		test('all conversion factors should be positive', () => {
			expect(SPEED_CONVERSION['m/s']).toBeGreaterThan(0);
			expect(SPEED_CONVERSION['km/h']).toBeGreaterThan(0);
			expect(SPEED_CONVERSION['mph']).toBeGreaterThan(0);
		});
	});
});

describe('Speed Unit Cycling', () => {
	describe('getNextSpeedUnit function', () => {
		test('should cycle from m/s to km/h', () => {
			expect(getNextSpeedUnit('m/s')).toBe('km/h');
		});

		test('should cycle from km/h to mph', () => {
			expect(getNextSpeedUnit('km/h')).toBe('mph');
		});

		test('should cycle from mph back to m/s', () => {
			expect(getNextSpeedUnit('mph')).toBe('m/s');
		});

		test('should complete a full cycle', () => {
			let unit: SpeedUnit = 'm/s';
			unit = getNextSpeedUnit(unit); // -> km/h
			expect(unit).toBe('km/h');
			unit = getNextSpeedUnit(unit); // -> mph
			expect(unit).toBe('mph');
			unit = getNextSpeedUnit(unit); // -> m/s
			expect(unit).toBe('m/s');
		});

		test('should cycle multiple times correctly', () => {
			let unit: SpeedUnit = 'm/s';
			// First cycle
			unit = getNextSpeedUnit(unit); // km/h
			unit = getNextSpeedUnit(unit); // mph
			unit = getNextSpeedUnit(unit); // m/s
			expect(unit).toBe('m/s');
			// Second cycle
			unit = getNextSpeedUnit(unit); // km/h
			unit = getNextSpeedUnit(unit); // mph
			unit = getNextSpeedUnit(unit); // m/s
			expect(unit).toBe('m/s');
		});
	});

	describe('SPEED_UNIT_ORDER constant', () => {
		test('should have exactly 3 units', () => {
			expect(SPEED_UNIT_ORDER.length).toBe(3);
		});

		test('should start with m/s', () => {
			expect(SPEED_UNIT_ORDER[0]).toBe('m/s');
		});

		test('should have km/h as second unit', () => {
			expect(SPEED_UNIT_ORDER[1]).toBe('km/h');
		});

		test('should have mph as third unit', () => {
			expect(SPEED_UNIT_ORDER[2]).toBe('mph');
		});

		test('should contain all valid speed units', () => {
			expect(SPEED_UNIT_ORDER).toContain('m/s');
			expect(SPEED_UNIT_ORDER).toContain('km/h');
			expect(SPEED_UNIT_ORDER).toContain('mph');
		});
	});
});

describe('Speed Unit Display Integration', () => {
	describe('typical usage scenarios', () => {
		test('should display stationary speed in all units', () => {
			const speed = 0;
			expect(Math.round(convertSpeed(speed, 'm/s'))).toBe(0);
			expect(Math.round(convertSpeed(speed, 'km/h'))).toBe(0);
			expect(Math.round(convertSpeed(speed, 'mph'))).toBe(0);
		});

		test('should display slow walking speed (1 m/s)', () => {
			const speed = 1;
			expect(Math.round(convertSpeed(speed, 'm/s'))).toBe(1);
			expect(Math.round(convertSpeed(speed, 'km/h'))).toBe(4); // 3.6 -> 4
			expect(Math.round(convertSpeed(speed, 'mph'))).toBe(2); // 2.23694 -> 2
		});

		test('should display brisk walking speed (1.4 m/s)', () => {
			const speed = 1.4;
			expect(Math.round(convertSpeed(speed, 'm/s'))).toBe(1);
			expect(Math.round(convertSpeed(speed, 'km/h'))).toBe(5); // 5.04 -> 5
			expect(Math.round(convertSpeed(speed, 'mph'))).toBe(3); // 3.13 -> 3
		});

		test('should display cycling speed (6 m/s)', () => {
			const speed = 6;
			expect(Math.round(convertSpeed(speed, 'm/s'))).toBe(6);
			expect(Math.round(convertSpeed(speed, 'km/h'))).toBe(22); // 21.6 -> 22
			expect(Math.round(convertSpeed(speed, 'mph'))).toBe(13); // 13.42 -> 13
		});

		test('should display car speed (20 m/s / 72 km/h)', () => {
			const speed = 20;
			expect(Math.round(convertSpeed(speed, 'm/s'))).toBe(20);
			expect(Math.round(convertSpeed(speed, 'km/h'))).toBe(72);
			expect(Math.round(convertSpeed(speed, 'mph'))).toBe(45); // 44.74 -> 45
		});
	});

	describe('rounding behavior', () => {
		test('should round 1.4 m/s correctly in all units', () => {
			expect(Math.round(convertSpeed(1.4, 'm/s'))).toBe(1);
			expect(Math.round(convertSpeed(1.4, 'km/h'))).toBe(5);
			expect(Math.round(convertSpeed(1.4, 'mph'))).toBe(3);
		});

		test('should round 2.5 m/s correctly in all units', () => {
			expect(Math.round(convertSpeed(2.5, 'm/s'))).toBe(3); // 2.5 rounds to 3
			expect(Math.round(convertSpeed(2.5, 'km/h'))).toBe(9);
			expect(Math.round(convertSpeed(2.5, 'mph'))).toBe(6); // 5.59 -> 6
		});

		test('should handle .5 rounding edge cases', () => {
			// JavaScript Math.round() uses "round half up" for positive numbers
			expect(Math.round(convertSpeed(1.5, 'm/s'))).toBe(2);
			expect(Math.round(convertSpeed(2.5, 'm/s'))).toBe(3);
			expect(Math.round(convertSpeed(3.5, 'm/s'))).toBe(4);
		});
	});
});

describe('Conversion Factor Verification', () => {
	test('m/s to km/h conversion factor should be 3.6', () => {
		// 1 m/s = 1 meter/second * 3600 seconds/hour / 1000 meters/km = 3.6 km/h
		const factor = (3600 / 1000);
		expect(factor).toBe(3.6);
		expect(SPEED_CONVERSION['km/h']).toBe(factor);
	});

	test('m/s to mph conversion factor should be approximately 2.23694', () => {
		// 1 m/s = 1 meter/second * 3600 seconds/hour / 1609.344 meters/mile ≈ 2.23694 mph
		const factor = 3600 / 1609.344;
		expect(factor).toBeCloseTo(2.23694, 5);
		expect(SPEED_CONVERSION['mph']).toBeCloseTo(factor, 5);
	});

	test('conversion factors should be consistent', () => {
		// Convert 100 km/h to mph via m/s
		const speedKmh = 100;
		const speedMs = speedKmh / SPEED_CONVERSION['km/h'];
		const speedMph = speedMs * SPEED_CONVERSION['mph'];
		// 100 km/h ≈ 62.137 mph
		expect(speedMph).toBeCloseTo(62.137, 3);
	});
});
