import { ScreenWakeLockManager } from '../src/script';

interface WakeLockSentinelLike extends EventTarget {
	released?: boolean;
	release(): Promise<void>;
}

interface WakeLockLike {
	request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

class MockWakeLockSentinel extends EventTarget implements WakeLockSentinelLike {
	released = false;

	async release(): Promise<void> {
		this.released = true;
		this.dispatchEvent(new Event('release'));
	}
}

describe('ScreenWakeLockManager', () => {
	test('should request a screen wake lock when visible', async () => {
		const request = jest.fn(async () => new MockWakeLockSentinel());
		const manager = new ScreenWakeLockManager({ request }, () => false);

		await manager.request();

		expect(request).toHaveBeenCalledWith('screen');
	});

	test('should not request a wake lock while hidden', async () => {
		const request = jest.fn(async () => new MockWakeLockSentinel());
		const manager = new ScreenWakeLockManager({ request }, () => true);

		await manager.request();

		expect(request).not.toHaveBeenCalled();
	});

	test('should release the active wake lock', async () => {
		const sentinel = new MockWakeLockSentinel();
		const request = jest.fn(async () => sentinel);
		const manager = new ScreenWakeLockManager({ request }, () => false);

		await manager.request();
		await manager.release();

		expect(sentinel.released).toBe(true);
	});

	test('should request again after the wake lock is released externally', async () => {
		const firstSentinel = new MockWakeLockSentinel();
		const secondSentinel = new MockWakeLockSentinel();
		const request = jest
			.fn<Promise<WakeLockSentinelLike>, ['screen']>()
			.mockResolvedValueOnce(firstSentinel)
			.mockResolvedValueOnce(secondSentinel);
		const manager = new ScreenWakeLockManager({ request }, () => false);

		await manager.request();
		await firstSentinel.release();
		await manager.request();

		expect(request).toHaveBeenCalledTimes(2);
	});

	test('should not keep the screen awake when release races an in-flight request', async () => {
		let resolveRequest!: (s: WakeLockSentinelLike) => void;
		const inflightSentinel = new MockWakeLockSentinel();
		const request = jest.fn(
			() => new Promise<WakeLockSentinelLike>(resolve => { resolveRequest = resolve; })
		);
		const manager = new ScreenWakeLockManager({ request }, () => false);

		const requestPromise = manager.request();
		// release() is called before request() resolves — this is the race
		await manager.release();
		resolveRequest(inflightSentinel);
		await requestPromise;

		// The sentinel acquired after release() was called must itself be released
		expect(inflightSentinel.released).toBe(true);
	});
});
