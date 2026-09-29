import {
	createMockPosition,
	getRequiredElement,
	installGeolocationHarness,
	installProj4Mock,
	installShareSupport,
	loadApplicationModule,
	removeShareSupport,
	renderApplicationShell
} from './test-helpers';

describe('button state integration', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		window.localStorage.clear();
		document.body.innerHTML = '';
		removeShareSupport();
	});

	it('keeps the last captured position shareable after positioning stops', async () => {
		// Arrange
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installShareSupport();
		installProj4Mock();
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const avgButton = getRequiredElement('avg-btn', HTMLButtonElement);
		const shareButton = getRequiredElement('share-btn', HTMLButtonElement);
		const stopButton = getRequiredElement('stop-btn', HTMLButtonElement);

		// Act
		posButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		stopButton.click();

		// Assert
		expect(posButton.disabled).toBe(false);
		expect(avgButton.disabled).toBe(true);
		expect(stopButton.disabled).toBe(true);
		expect(shareButton.disabled).toBe(false);
		expect(avgButton.textContent).toBe('Starta medel');
	});

	it('disables sharing when the browser does not support the share API', async () => {
		// Arrange
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installProj4Mock();
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const shareButton = getRequiredElement('share-btn', HTMLButtonElement);
		const stopButton = getRequiredElement('stop-btn', HTMLButtonElement);

		// Act
		posButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		stopButton.click();

		// Assert
		expect(shareButton.disabled).toBe(true);
	});

	it('shows the averaging stop label only while averaging is active', async () => {
		// Arrange
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installShareSupport();
		installProj4Mock((_: string, __: string, [longitude, latitude]) => [
			670000 + ((longitude - 18) * 10),
			6580000 + ((latitude - 59) * 10)
		]);
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const avgButton = getRequiredElement('avg-btn', HTMLButtonElement);

		// Act
		posButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		avgButton.click();
		expect(avgButton.textContent).toBe('Stoppa medel');

		avgButton.click();

		// Assert
		expect(avgButton.textContent).toBe('Starta medel');
		expect(avgButton.disabled).toBe(false);
	});

	it('shows averaging metadata and keeps it when stopping positioning', async () => {
		// Arrange
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installShareSupport();
		installProj4Mock((_: string, __: string, [longitude, latitude]) => [
			670000 + ((longitude - 18) * 10),
			6580000 + ((latitude - 59) * 10)
		]);
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const avgButton = getRequiredElement('avg-btn', HTMLButtonElement);
		const stopButton = getRequiredElement('stop-btn', HTMLButtonElement);
		const averagingMetadata = getRequiredElement('avg-meta', HTMLDivElement);

		// Act
		posButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07, timestamp: 1_000 }));
		avgButton.click();
		geolocation.emitPosition(createMockPosition({ latitude: 59.34, longitude: 18.08, timestamp: 6_000 }));

		// Assert
		expect(averagingMetadata.hidden).toBe(false);
		expect(averagingMetadata.textContent).toBe('Medel: 2\u00A0prov · 5\u00A0s');

		// Act
		stopButton.click();

		// Assert
		expect(averagingMetadata.hidden).toBe(false);
		expect(averagingMetadata.textContent).toBe('Medel: 2\u00A0prov · 5\u00A0s');
	});

	it('does not offer averaging or sharing until a valid projected position arrives', async () => {
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installShareSupport();
		const projection = installProj4Mock(() => [Number.NaN, Number.NaN]);
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const avgButton = getRequiredElement('avg-btn', HTMLButtonElement);
		const shareButton = getRequiredElement('share-btn', HTMLButtonElement);
		const stopButton = getRequiredElement('stop-btn', HTMLButtonElement);
		posButton.click();
		expect(posButton.disabled).toBe(true);
		expect(stopButton.disabled).toBe(false);
		expect(avgButton.disabled).toBe(true);
		expect(shareButton.disabled).toBe(true);

		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		expect(getRequiredElement('sweref-n', HTMLDivElement).textContent).toBe('Ej\u00A0tillgängligt');
		expect(getRequiredElement('notification-title', HTMLSpanElement).textContent).toBe('Transformationsfel');
		expect(avgButton.disabled).toBe(true);
		expect(shareButton.disabled).toBe(true);

		projection.transform.mockReturnValue([670000, 6580000]);
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		expect(avgButton.disabled).toBe(false);
		expect(shareButton.disabled).toBe(false);
	});

	it('clears a failed watch and ignores callbacks from it after restart', async () => {
		renderApplicationShell();
		const geolocation = installGeolocationHarness();
		installShareSupport();
		installProj4Mock();
		await loadApplicationModule();

		const posButton = getRequiredElement('pos-btn', HTMLButtonElement);
		const stopButton = getRequiredElement('stop-btn', HTMLButtonElement);
		const shareButton = getRequiredElement('share-btn', HTMLButtonElement);
		posButton.click();
		const oldSuccess = geolocation.watchPosition.mock.calls[0][0];
		geolocation.emitError({ code: 1, message: 'Permission denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
		expect(geolocation.clearWatch).toHaveBeenCalledWith(1);
		expect(posButton.disabled).toBe(false);
		expect(stopButton.disabled).toBe(true);

		posButton.click();
		oldSuccess(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		expect(shareButton.disabled).toBe(true);
		geolocation.emitPosition(createMockPosition({ latitude: 59.33, longitude: 18.07 }));
		expect(shareButton.disabled).toBe(false);
	});
});
