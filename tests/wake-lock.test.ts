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

class ScreenWakeLockManager {
	private sentinel: WakeLockSentinelLike | null = null;
	private readonly wakeLock: WakeLockLike | undefined;
	private readonly isHidden: () => boolean;

	constructor(wakeLock: WakeLockLike | undefined, isHidden: () => boolean) {
		this.wakeLock = wakeLock;
		this.isHidden = isHidden;
	}

	async request(): Promise<void> {
		if (this.isHidden() || !this.wakeLock) {
			return;
		}

		if (this.sentinel && this.sentinel.released !== true) {
			return;
		}

		const sentinel = await this.wakeLock.request('screen');
		sentinel.addEventListener('release', () => {
			if (this.sentinel === sentinel) {
				this.sentinel = null;
			}
		});
		this.sentinel = sentinel;
	}

	async release(): Promise<void> {
		if (!this.sentinel) {
			return;
		}

		const sentinel = this.sentinel;
		this.sentinel = null;
		await sentinel.release();
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
});
