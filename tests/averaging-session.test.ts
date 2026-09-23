interface SwerefCoordinates {
	northing: number;
	easting: number;
}

class CoordinateAveragingSession {
	private active = false;
	private sampleCount = 0;
	private northingSum = 0;
	private eastingSum = 0;

	isActive(): boolean {
		return this.active;
	}

	start(initialSample: SwerefCoordinates): SwerefCoordinates {
		this.active = true;
		this.sampleCount = 0;
		this.northingSum = 0;
		this.eastingSum = 0;
		return this.addSample(initialSample) ?? initialSample;
	}

	addSample(sample: SwerefCoordinates): SwerefCoordinates | null {
		if (!this.active || !Number.isFinite(sample.northing) || !Number.isFinite(sample.easting)) {
			return null;
		}

		this.sampleCount += 1;
		this.northingSum += sample.northing;
		this.eastingSum += sample.easting;
		return this.getAverage();
	}

	getAverage(): SwerefCoordinates | null {
		if (this.sampleCount === 0) {
			return null;
		}

		return {
			northing: this.northingSum / this.sampleCount,
			easting: this.eastingSum / this.sampleCount
		};
	}

	stop(): void {
		this.active = false;
		this.sampleCount = 0;
		this.northingSum = 0;
		this.eastingSum = 0;
	}
}

describe('CoordinateAveragingSession', () => {
	test('should seed the session with the first sample', () => {
		const session = new CoordinateAveragingSession();

		const average = session.start({ northing: 6580123.4, easting: 674456.7 });

		expect(session.isActive()).toBe(true);
		expect(average).toEqual({ northing: 6580123.4, easting: 674456.7 });
	});

	test('should return a running average across multiple samples', () => {
		const session = new CoordinateAveragingSession();

		session.start({ northing: 6580123.0, easting: 674456.0 });
		const average = session.addSample({ northing: 6580125.0, easting: 674458.0 });

		expect(average).toEqual({ northing: 6580124.0, easting: 674457.0 });
	});

	test('should ignore invalid samples', () => {
		const session = new CoordinateAveragingSession();

		session.start({ northing: 6580123.0, easting: 674456.0 });
		const average = session.addSample({ northing: Number.NaN, easting: 674458.0 });

		expect(average).toBeNull();
		expect(session.getAverage()).toEqual({ northing: 6580123.0, easting: 674456.0 });
	});

	test('should reset accumulated state when stopped', () => {
		const session = new CoordinateAveragingSession();

		session.start({ northing: 6580123.0, easting: 674456.0 });
		session.addSample({ northing: 6580125.0, easting: 674458.0 });
		session.stop();

		expect(session.isActive()).toBe(false);
		expect(session.getAverage()).toBeNull();
		expect(session.addSample({ northing: 6580127.0, easting: 674460.0 })).toBeNull();
	});
});
