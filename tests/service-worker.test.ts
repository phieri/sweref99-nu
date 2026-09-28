import {
	clearProj4Mock,
	flushMicrotasks,
	installProj4Mock,
	loadApplicationModule,
	renderApplicationShell
} from './test-helpers';

type MockServiceWorker = EventTarget & {
	state: ServiceWorkerState;
	postMessage: jest.Mock;
};

function createMockServiceWorker(state: ServiceWorkerState = 'activated'): MockServiceWorker {
	return Object.assign(new EventTarget(), {
		state,
		postMessage: jest.fn()
	});
}

function installServiceWorkerHarness() {
	const registration = Object.assign(new EventTarget(), {
		scope: 'https://example.com/',
		waiting: null as ServiceWorker | null,
		installing: createMockServiceWorker('installing') as ServiceWorker | null
	});
	const register = jest.fn(async () => registration as unknown as ServiceWorkerRegistration);
	const container = Object.assign(new EventTarget(), {
		controller: createMockServiceWorker(),
		register
	});
	const addEventListenerSpy = jest.spyOn(container, 'addEventListener');

	Object.defineProperty(window.navigator, 'serviceWorker', {
		configurable: true,
		value: container
	});

	return {
		addEventListenerSpy,
		container,
		register,
		registration,
		installingWorker: registration.installing as unknown as MockServiceWorker,
		setWaitingWorker(): MockServiceWorker {
			const waitingWorker = createMockServiceWorker();
			registration.waiting = waitingWorker as unknown as ServiceWorker;
			return waitingWorker;
		},
		dispatchControllerChange(): void {
			container.dispatchEvent(new Event('controllerchange'));
		},
		dispatchUpdateFound(): void {
			registration.dispatchEvent(new Event('updatefound'));
		},
		dispatchInstallingStateChange(): void {
			this.installingWorker.dispatchEvent(new Event('statechange'));
		}
	};
}

describe('service worker update flow', () => {
	afterEach(() => {
		clearProj4Mock();
		jest.restoreAllMocks();
		window.localStorage.clear();
		document.body.innerHTML = '';
		Object.defineProperty(window.navigator, 'serviceWorker', {
			configurable: true,
			value: undefined
		});
	});

	it('requests skipWaiting for an installed update and reloads only after controllerchange', async () => {
		renderApplicationShell();
		installProj4Mock();
		Object.defineProperty(window, 'isSecureContext', {
			configurable: true,
			value: true
		});
		const serviceWorker = installServiceWorkerHarness();

		const applicationModule = await loadApplicationModule();
		const reload = jest.fn();
		applicationModule.setServiceWorkerReloadHandlerForTesting(reload);
		window.dispatchEvent(new Event('load'));
		await flushMicrotasks();

		const waitingWorker = serviceWorker.setWaitingWorker();
		serviceWorker.dispatchUpdateFound();
		serviceWorker.installingWorker.state = 'installed';
		serviceWorker.dispatchInstallingStateChange();

		expect(serviceWorker.register).toHaveBeenCalledWith(new URL('./sw.js', window.location.href).href);
		expect(serviceWorker.addEventListenerSpy).toHaveBeenCalledWith('controllerchange', expect.any(Function));
		expect(waitingWorker.postMessage).toHaveBeenCalledWith('SKIP_WAITING');
		expect(reload).not.toHaveBeenCalled();

		serviceWorker.dispatchControllerChange();

		expect(reload).toHaveBeenCalledTimes(1);
	});
});
