import {
	flushMicrotasks,
	getRequiredElement,
	installGeolocationHarness,
	loadApplicationModule,
	renderApplicationShell
} from './test-helpers';

const DETAILS_STATE_STORAGE_KEY = 'sweref99-details-state';
const toggleListeners = new Map<HTMLDetailsElement, EventListenerOrEventListenerObject>();

function setOpenState(details: HTMLDetailsElement, isOpen: boolean): void {
	Object.defineProperty(details, 'open', {
		configurable: true,
		value: isOpen,
		writable: true
	});
}

describe('details state persistence', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.spyOn(HTMLDetailsElement.prototype, 'addEventListener').mockImplementation(
			function (
				this: HTMLDetailsElement,
				type: string,
				listener: EventListenerOrEventListenerObject | null,
				options?: boolean | AddEventListenerOptions
			): void {
				if (type === 'toggle' && listener) {
					toggleListeners.set(this, listener);
				}

				EventTarget.prototype.addEventListener.call(this, type, listener, options);
			}
		);
	});

	afterEach(() => {
		for (const [details, listener] of toggleListeners) {
			details.removeEventListener('toggle', listener);
		}
		toggleListeners.clear();
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
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
				<details id="details-a" open><summary>A</summary></details>
				<details id="details-b"><summary>B</summary></details>
			`
		});
		installGeolocationHarness();

		// Act
		await loadApplicationModule();
		const detailsA = getRequiredElement('details-a', HTMLDetailsElement);
		const detailsB = getRequiredElement('details-b', HTMLDetailsElement);
		setOpenState(detailsB, true);
		detailsB.dispatchEvent(new Event('toggle'));
		jest.runOnlyPendingTimers();
		await flushMicrotasks();

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
		setOpenState(getRequiredElement('details-a', HTMLDetailsElement), true);
		setOpenState(getRequiredElement('details-b', HTMLDetailsElement), false);
		setOpenState(getRequiredElement('details-c', HTMLDetailsElement), true);
		setOpenState(getRequiredElement('details-d', HTMLDetailsElement), true);
		getRequiredElement('details-d', HTMLDetailsElement).dispatchEvent(new Event('toggle'));
		jest.runOnlyPendingTimers();
		await flushMicrotasks();

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
		jest.runOnlyPendingTimers();
		await flushMicrotasks();

		// Assert
		expect(getRequiredElement('details-a', HTMLDetailsElement).open).toBe(true);
		expect(warn).toHaveBeenCalledWith('Failed to restore details state:', expect.any(SyntaxError));
	});
});
