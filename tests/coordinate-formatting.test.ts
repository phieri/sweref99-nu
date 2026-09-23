import {
	createMockPosition,
	flushMicrotasks,
	getRequiredElement,
	installGeolocationHarness,
	installProj4Mock,
	installShareSupport,
	loadApplicationModule,
	removeShareSupport,
	renderApplicationShell
} from './test-helpers';

describe('coordinate formatting integration', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-07-01T12:00:00Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		window.localStorage.clear();
		document.body.innerHTML = '';
		removeShareSupport();
	});

	it('renders aligned SWEREF coordinates after a position update', async () => {
		// Arrange
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installProj4Mock(() => [674455.4, 6580122.1]);
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);

		// Act
		posButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));

		// Assert
		const northing = getRequiredElement('sweref-n', HTMLDivElement).textContent;
		const easting = getRequiredElement('sweref-e', HTMLDivElement).textContent;
		expect(northing).toMatch(/^N\u00A0\d{7}$/u);
		expect(easting).toMatch(/^E\u00A0\u00A0\d{6}$/u);
		expect(northing?.length).toBe(easting?.length);
	});

	it('normalizes the extra easting spacing when sharing averaged coordinates', async () => {
		// Arrange
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		const { share } = installShareSupport();
		installProj4Mock((_: string, __: string, [longitude, latitude]) => [
			674455.2 + ((longitude - 18) * 10),
			6580122.2 + ((latitude - 59) * 10)
		]);
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const avgButton = getRequiredElement('avg-btn', HTMLButtonElement);
		const shareButton = getRequiredElement('share-btn', HTMLButtonElement);

		// Act
		posButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		avgButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.34, longitude: 18.08 }));
		shareButton.click();
		await flushMicrotasks();

		// Assert
		expect(share).toHaveBeenCalledWith({
			title: 'Position',
			text: expect.stringMatching(
				/^N\u00A0\d+,\d{2} E \d+,\d{2} \(SWEREF 99 TM\)$/u
			)
		});
	});
});
