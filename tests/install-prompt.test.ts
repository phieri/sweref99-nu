import { getRequiredElement, loadApplicationModule, renderApplicationShell } from './test-helpers';

function addBanner(): void {
	document.body.insertAdjacentHTML('beforeend', `
		<aside id="install-banner" hidden>
			<span id="install-banner-message"></span>
			<button id="install-btn" hidden></button>
			<button id="install-dismiss-btn"></button>
		</aside>`);
}

function fireInstallPrompt(): jest.Mock {
	const prompt = jest.fn().mockResolvedValue(undefined);
	const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
		prompt,
		userChoice: Promise.resolve({ outcome: 'accepted' })
	});
	window.dispatchEvent(event);
	return prompt;
}

describe('install prompt', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		renderApplicationShell();
		addBanner();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		window.localStorage.clear();
		document.body.innerHTML = '';
	});

	it('does not show on the first visit', async () => {
		await loadApplicationModule();
		fireInstallPrompt();
		jest.advanceTimersByTime(20000);
		expect(getRequiredElement('install-banner', HTMLElement).hidden).toBe(true);
	});

	it('shows for returning users after a delay and installs on click', async () => {
		window.localStorage.setItem('sweref99-install-visits', '1');
		await loadApplicationModule();
		const prompt = fireInstallPrompt();
		const banner = getRequiredElement('install-banner', HTMLElement);
		expect(banner.hidden).toBe(true);
		jest.advanceTimersByTime(10000);
		expect(banner.hidden).toBe(false);
		getRequiredElement('install-btn', HTMLButtonElement).click();
		expect(prompt).toHaveBeenCalled();
		expect(banner.hidden).toBe(true);
	});

	it('snoozes after dismissal', async () => {
		window.localStorage.setItem('sweref99-install-visits', '1');
		await loadApplicationModule();
		fireInstallPrompt();
		jest.advanceTimersByTime(10000);
		getRequiredElement('install-dismiss-btn', HTMLButtonElement).click();
		expect(getRequiredElement('install-banner', HTMLElement).hidden).toBe(true);
		expect(window.localStorage.getItem('sweref99-install-dismissals')).toBe('1');

		await loadApplicationModule();
		fireInstallPrompt();
		jest.advanceTimersByTime(20000);
		expect(getRequiredElement('install-banner', HTMLElement).hidden).toBe(true);
	});
});
