type Proj4Defs = (code?: string, definition?: string) => Record<string, never> | boolean | void;
type Proj4Transform = (
	from: string,
	to: string,
	coords: readonly [number, number]
) => [number, number];

export type Proj4Mock = ((
	from: string,
	to: string,
	coords: readonly [number, number]
) => [number, number]) & {
	defs: jest.MockedFunction<Proj4Defs>;
	transform: jest.MockedFunction<Proj4Transform>;
};

type WatchPositionMock = (
	success: PositionCallback,
	error?: PositionErrorCallback | null,
	options?: PositionOptions
) => number;

type ClearWatchMock = (watchId: number) => void;
type GetCurrentPositionMock = (
	success: PositionCallback,
	error?: PositionErrorCallback | null,
	options?: PositionOptions
) => void;

type ShareMock = (data: ShareData) => Promise<void>;
type CanShareMock = (data?: ShareData) => boolean;

export interface GeolocationHarness {
	watchPosition: jest.MockedFunction<WatchPositionMock>;
	clearWatch: jest.MockedFunction<ClearWatchMock>;
	getCurrentPosition: jest.MockedFunction<GetCurrentPositionMock>;
	emitPosition(position: GeolocationPosition): void;
}

declare global {
	var proj4: Proj4Mock | undefined;
}

export function createProj4Mock(transformImpl?: Proj4Transform): Proj4Mock {
	const defs: jest.MockedFunction<Proj4Defs> = jest.fn((code?: string, definition?: string) => {
		if (code === undefined) {
			return {};
		}

		if (definition !== undefined) {
			return;
		}

		return code === 'EPSG:3006';
	});

	const transform: jest.MockedFunction<Proj4Transform> = jest.fn(
		transformImpl ??
		((_: string, __: string, [longitude, latitude]: readonly [number, number]) => [
			500000 + ((longitude - 15) * 1000),
			6500000 + ((latitude - 59) * 1000)
		])
	);

	return Object.assign(
		(from: string, to: string, coords: readonly [number, number]) => transform(from, to, coords),
		{ defs, transform }
	);
}

export function installProj4Mock(transformImpl?: Proj4Transform): Proj4Mock {
	const proj4 = createProj4Mock(transformImpl);
	globalThis.proj4 = proj4;
	return proj4;
}

export function clearProj4Mock(): void {
	Reflect.deleteProperty(globalThis, 'proj4');
}

export function createMockPosition({
	latitude,
	longitude,
	accuracy = 5,
	speed = null,
	timestamp = Date.now()
}: {
	latitude: number;
	longitude: number;
	accuracy?: number;
	speed?: number | null;
	timestamp?: number;
}): GeolocationPosition {
	const coords: GeolocationCoordinates = {
		latitude,
		longitude,
		accuracy,
		altitude: null,
		altitudeAccuracy: null,
		heading: null,
		speed
	};

	return { coords, timestamp };
}

export function installGeolocationHarness(): GeolocationHarness {
	let watchSuccess: PositionCallback | null = null;

	const watchPosition: jest.MockedFunction<WatchPositionMock> = jest.fn((success) => {
		watchSuccess = success;
		return 1;
	});
	const clearWatch: jest.MockedFunction<ClearWatchMock> = jest.fn();
	const getCurrentPosition: jest.MockedFunction<GetCurrentPositionMock> = jest.fn();

	const geolocation = {
		watchPosition,
		clearWatch,
		getCurrentPosition
	} satisfies Pick<Geolocation, 'watchPosition' | 'clearWatch' | 'getCurrentPosition'>;

	Object.defineProperty(window.navigator, 'geolocation', {
		configurable: true,
		value: geolocation
	});

	return {
		watchPosition,
		clearWatch,
		getCurrentPosition,
		emitPosition(position: GeolocationPosition): void {
			if (!watchSuccess) {
				throw new Error('watchPosition() has not been called yet.');
			}

			watchSuccess(position);
		}
	};
}

export function installShareSupport(): {
	share: jest.MockedFunction<ShareMock>;
	canShare: jest.MockedFunction<CanShareMock>;
} {
	const share: jest.MockedFunction<ShareMock> = jest.fn(async () => undefined);
	const canShare: jest.MockedFunction<CanShareMock> = jest.fn(() => true);

	Object.defineProperty(window.navigator, 'share', {
		configurable: true,
		value: share
	});
	Object.defineProperty(window.navigator, 'canShare', {
		configurable: true,
		value: canShare
	});

	return { share, canShare };
}

export function removeShareSupport(): void {
	Object.defineProperty(window.navigator, 'share', {
		configurable: true,
		value: undefined
	});
	Object.defineProperty(window.navigator, 'canShare', {
		configurable: true,
		value: undefined
	});
}

export function renderApplicationShell(options: {
	detailsMarkup?: string;
	speedText?: string;
} = {}): void {
	const {
		detailsMarkup = '',
		speedText = `–\u00A0m/s`
	} = options;

	document.body.innerHTML = `
		<div id="uncert"></div>
		<button id="speed" type="button">${speedText}</button>
		<div id="timestamp">--:--:--</div>
		<div id="sweref-n"></div>
		<div id="sweref-e"></div>
		<div id="wgs84-n"></div>
		<div id="wgs84-e"></div>
		<button id="pos-btn" type="button" disabled>Positionera</button>
		<button id="avg-btn" type="button" disabled>Starta medel</button>
		<button id="share-btn" type="button" disabled>Dela</button>
		<button id="stop-btn" type="button" disabled>Stoppa</button>
		<dialog id="notification-dialog">
			<div id="notification-header" hidden>
				<span id="notification-title"></span>
			</div>
			<div id="notification-content"></div>
			<svg><circle id="notification-countdown"></circle></svg>
		</dialog>
		${detailsMarkup}
	`;

	const dialog = document.getElementById('notification-dialog');
	if (dialog instanceof HTMLElement) {
		Object.defineProperty(dialog, 'showModal', {
			configurable: true,
			value: jest.fn(() => {
				dialog.setAttribute('open', '');
			})
		});
		Object.defineProperty(dialog, 'close', {
			configurable: true,
			value: jest.fn(() => {
				dialog.removeAttribute('open');
			})
		});
	}

	Object.defineProperty(window, 'isSecureContext', {
		configurable: true,
		value: false
	});
}

export async function loadApplicationModule(): Promise<typeof import('../src/script')> {
	jest.resetModules();
	return import('../src/script');
}

export function getRequiredElement<T extends Element>(
	id: string,
	expectedType: abstract new (...args: never[]) => T
): T {
	const element = document.getElementById(id);
	if (!(element instanceof expectedType)) {
		throw new Error(`Expected #${id} to be a ${expectedType.name}`);
	}

	return element;
}

export async function flushMicrotasks(): Promise<void> {
	await Promise.resolve();
}
