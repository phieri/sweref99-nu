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
});
