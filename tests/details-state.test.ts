import {
	getRequiredElement,
	installGeolocationHarness,
	loadApplicationModule,
	renderApplicationShell
} from './test-helpers';

const DETAILS_STATE_STORAGE_KEY = 'sweref99-details-state';

describe('details state persistence', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		window.localStorage.clear();
		document.body.innerHTML = '';
	});

	it('restores saved details state on startup and persists later toggles', async () => {
		// Arrange
		window.localStorage.setItem(
			DETAILS_STATE_STORAGE_KEY,
			JSON.stringify({ 'details-a': true, 'details-b': false })
		);
		renderApplicationShell({
			detailsMarkup: `
				<details id="details-a"><summary>A</summary></details>
				<details id="details-b"><summary>B</summary></details>
			`
		});
		installGeolocationHarness();

		// Act
		await loadApplicationModule();
		const detailsA = getRequiredElement('details-a', HTMLDetailsElement);
		const detailsB = getRequiredElement('details-b', HTMLDetailsElement);
		detailsB.open = true;
		detailsB.dispatchEvent(new Event('toggle'));

		// Assert
		expect(detailsA.open).toBe(true);
		expect(detailsB.open).toBe(true);
		expect(window.localStorage.getItem(DETAILS_STATE_STORAGE_KEY)).toBe(
			JSON.stringify({ 'details-a': true, 'details-b': true })
		);
	});

	it('stores at most the first three identified details elements', async () => {
		// Arrange
		renderApplicationShell({
			detailsMarkup: `
				<details id="details-a"><summary>A</summary></details>
				<details id="details-b"><summary>B</summary></details>
				<details id="details-c"><summary>C</summary></details>
				<details id="details-d"><summary>D</summary></details>
			`
		});
		installGeolocationHarness();

		// Act
		await loadApplicationModule();
		getRequiredElement('details-a', HTMLDetailsElement).open = true;
		getRequiredElement('details-b', HTMLDetailsElement).open = false;
		getRequiredElement('details-c', HTMLDetailsElement).open = true;
		getRequiredElement('details-d', HTMLDetailsElement).open = true;
		getRequiredElement('details-d', HTMLDetailsElement).dispatchEvent(new Event('toggle'));

		// Assert
		expect(window.localStorage.getItem(DETAILS_STATE_STORAGE_KEY)).toBe(
			JSON.stringify({
				'details-a': true,
				'details-b': false,
				'details-c': true
			})
		);
	});

	it('warns and leaves the DOM untouched when stored state is invalid JSON', async () => {
		// Arrange
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		window.localStorage.setItem(DETAILS_STATE_STORAGE_KEY, 'not-json');
		renderApplicationShell({
			detailsMarkup: `
				<details id="details-a" open><summary>A</summary></details>
			`
		});
		installGeolocationHarness();

		// Act
		await loadApplicationModule();

		// Assert
		expect(getRequiredElement('details-a', HTMLDetailsElement).open).toBe(true);
		expect(warn).toHaveBeenCalledWith('Failed to restore details state:', expect.any(SyntaxError));
	});
});
