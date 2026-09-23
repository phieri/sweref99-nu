import {
	getRequiredElement,
	installGeolocationHarness,
	loadApplicationModule,
	renderApplicationShell
} from './test-helpers';

const SPEED_UNIT_STORAGE_KEY = 'sweref99-speed-unit';

describe('speed unit integration', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		window.localStorage.clear();
		document.body.innerHTML = '';
	});

	it('restores the saved speed unit in the existing display text', async () => {
		// Arrange
		window.localStorage.setItem(SPEED_UNIT_STORAGE_KEY, 'km/h');
		renderApplicationShell({ speedText: `–\u00A0m/s` });
		installGeolocationHarness();

		// Act
		await loadApplicationModule();

		// Assert
		expect(getRequiredElement('speed', HTMLButtonElement).textContent).toBe(`–\u00A0km/h`);
	});

	it('cycles through all units and persists each new preference', async () => {
		// Arrange
		renderApplicationShell();
		installGeolocationHarness();
		await loadApplicationModule();

		const speedButton = getRequiredElement('speed', HTMLButtonElement);

		// Act + Assert
		speedButton.click();
		expect(speedButton.textContent).toBe(`?\u00A0km/h`);
		expect(window.localStorage.getItem(SPEED_UNIT_STORAGE_KEY)).toBe('km/h');

		speedButton.click();
		expect(speedButton.textContent).toBe(`?\u00A0mph`);
		expect(window.localStorage.getItem(SPEED_UNIT_STORAGE_KEY)).toBe('mph');

		speedButton.click();
		expect(speedButton.textContent).toBe(`?\u00A0m/s`);
		expect(window.localStorage.getItem(SPEED_UNIT_STORAGE_KEY)).toBe('m/s');
	});
});
