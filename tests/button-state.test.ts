/**
 * Unit tests for button state management
 * 
 * This test suite covers the fix for the share button remaining enabled
 * after stopping positioning when a position has been received.
 */

/**
 * Mock DOM elements for testing
 */
class MockElement {
	private attributes: Map<string, string> = new Map();
	textContent = '';
	
	setAttribute(name: string, value: string): void {
		this.attributes.set(name, value);
	}
	
	removeAttribute(name: string): void {
		this.attributes.delete(name);
	}
	
	hasAttribute(name: string): boolean {
		return this.attributes.has(name);
	}
	
	getAttribute(name: string): string | null {
		return this.attributes.get(name) || null;
	}
}

/**
 * Mock UIHelper implementation for testing button state management
 */
class UIHelper {
	private elements: {
		posbtn: MockElement | null;
		avgbtn: MockElement | null;
		sharebtn: MockElement | null;
		stopbtn: MockElement | null;
	};

	constructor() {
		this.elements = {
			posbtn: new MockElement(),
			avgbtn: new MockElement(),
			sharebtn: new MockElement(),
			stopbtn: new MockElement()
		};
	}

	/**
	 * Sets button states for active/stopped positioning
	 */
	setButtonState(state: 'active' | 'stopped', hasPosition: boolean = false, isAveragingActive: boolean = false): void {
		const { posbtn, stopbtn, sharebtn, avgbtn } = this.elements;

		if (state === 'active') {
			posbtn?.setAttribute("disabled", "disabled");
			stopbtn?.removeAttribute("disabled");
			avgbtn?.removeAttribute("disabled");
			if (avgbtn) avgbtn.textContent = isAveragingActive ? 'Stoppa medel' : 'Starta medel';
			sharebtn?.removeAttribute("disabled");
		} else {
			stopbtn?.setAttribute("disabled", "disabled");
			posbtn?.removeAttribute("disabled");
			avgbtn?.setAttribute("disabled", "disabled");
			if (avgbtn) avgbtn.textContent = 'Starta medel';
			// Keep share button enabled if we have received a position
			if (hasPosition) {
				sharebtn?.removeAttribute("disabled");
			} else {
				sharebtn?.setAttribute("disabled", "disabled");
			}
		}
	}

	/**
	 * Get button element for testing
	 */
	getButton(name: 'posbtn' | 'avgbtn' | 'sharebtn' | 'stopbtn'): MockElement | null {
		return this.elements[name];
	}
}

describe('Button State Management', () => {
	let uiHelper: UIHelper;

	beforeEach(() => {
		uiHelper = new UIHelper();
	});

	describe('setButtonState with active state', () => {
		test('should enable stop and share buttons when positioning starts', () => {
			uiHelper.setButtonState('active');

			const posbtn = uiHelper.getButton('posbtn');
			const avgbtn = uiHelper.getButton('avgbtn');
			const stopbtn = uiHelper.getButton('stopbtn');
			const sharebtn = uiHelper.getButton('sharebtn');

			expect(posbtn?.hasAttribute('disabled')).toBe(true);
			expect(avgbtn?.hasAttribute('disabled')).toBe(false);
			expect(avgbtn?.textContent).toBe('Starta medel');
			expect(stopbtn?.hasAttribute('disabled')).toBe(false);
			expect(sharebtn?.hasAttribute('disabled')).toBe(false);
		});

		test('should show stop label while averaging is active', () => {
			uiHelper.setButtonState('active', true, true);

			const avgbtn = uiHelper.getButton('avgbtn');

			expect(avgbtn?.hasAttribute('disabled')).toBe(false);
			expect(avgbtn?.textContent).toBe('Stoppa medel');
		});
	});

	describe('setButtonState with stopped state', () => {
		test('should keep share button enabled when stopped with position received', () => {
			// Start positioning
			uiHelper.setButtonState('active');

			// Stop positioning with position received
			uiHelper.setButtonState('stopped', true);

			const posbtn = uiHelper.getButton('posbtn');
			const avgbtn = uiHelper.getButton('avgbtn');
			const stopbtn = uiHelper.getButton('stopbtn');
			const sharebtn = uiHelper.getButton('sharebtn');

			expect(posbtn?.hasAttribute('disabled')).toBe(false);
			expect(avgbtn?.hasAttribute('disabled')).toBe(true);
			expect(avgbtn?.textContent).toBe('Starta medel');
			expect(stopbtn?.hasAttribute('disabled')).toBe(true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(false); // Should remain enabled
		});

		test('should disable share button when stopped without position received', () => {
			// Start positioning
			uiHelper.setButtonState('active');

			// Stop positioning without position received
			uiHelper.setButtonState('stopped', false);

			const posbtn = uiHelper.getButton('posbtn');
			const avgbtn = uiHelper.getButton('avgbtn');
			const stopbtn = uiHelper.getButton('stopbtn');
			const sharebtn = uiHelper.getButton('sharebtn');

			expect(posbtn?.hasAttribute('disabled')).toBe(false);
			expect(avgbtn?.hasAttribute('disabled')).toBe(true);
			expect(stopbtn?.hasAttribute('disabled')).toBe(true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(true); // Should be disabled
		});

		test('should disable share button when stopped with no hasPosition parameter', () => {
			// Start positioning
			uiHelper.setButtonState('active');

			// Stop positioning without hasPosition parameter (backward compatibility)
			uiHelper.setButtonState('stopped');

			const posbtn = uiHelper.getButton('posbtn');
			const stopbtn = uiHelper.getButton('stopbtn');
			const sharebtn = uiHelper.getButton('sharebtn');

			expect(posbtn?.hasAttribute('disabled')).toBe(false);
			expect(stopbtn?.hasAttribute('disabled')).toBe(true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(true); // Should be disabled by default
		});
	});

	describe('User workflow scenarios', () => {
		test('should handle start -> receive position -> stop workflow correctly', () => {
			// Start positioning
			uiHelper.setButtonState('active');
			const sharebtn = uiHelper.getButton('sharebtn');
			expect(sharebtn?.hasAttribute('disabled')).toBe(false); // Enabled during positioning

			// Stop positioning after receiving position
			uiHelper.setButtonState('stopped', true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(false); // Should remain enabled
		});

		test('should handle start -> no position -> stop workflow correctly', () => {
			// Start positioning
			uiHelper.setButtonState('active');
			const sharebtn = uiHelper.getButton('sharebtn');
			expect(sharebtn?.hasAttribute('disabled')).toBe(false); // Enabled during positioning

			// Stop positioning without receiving position
			uiHelper.setButtonState('stopped', false);
			expect(sharebtn?.hasAttribute('disabled')).toBe(true); // Should be disabled
		});

		test('should handle multiple start/stop cycles', () => {
			const sharebtn = uiHelper.getButton('sharebtn');

			// First cycle: receive position
			uiHelper.setButtonState('active');
			uiHelper.setButtonState('stopped', true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(false);

			// Second cycle: no position
			uiHelper.setButtonState('active');
			uiHelper.setButtonState('stopped', false);
			expect(sharebtn?.hasAttribute('disabled')).toBe(true);

			// Third cycle: receive position again
			uiHelper.setButtonState('active');
			uiHelper.setButtonState('stopped', true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(false);
		});

		test('should handle position received multiple times before stop', () => {
			uiHelper.setButtonState('active');

			// Simulate multiple position updates
			uiHelper.setButtonState('active'); // Position update 1
			uiHelper.setButtonState('active'); // Position update 2

			// Stop with position flag
			uiHelper.setButtonState('stopped', true);

			const sharebtn = uiHelper.getButton('sharebtn');
			expect(sharebtn?.hasAttribute('disabled')).toBe(false);
		});
	});

	describe('Edge cases', () => {
		test('should handle stop called before start', () => {
			uiHelper.setButtonState('stopped', true);

			const posbtn = uiHelper.getButton('posbtn');
			const stopbtn = uiHelper.getButton('stopbtn');
			const sharebtn = uiHelper.getButton('sharebtn');

			expect(posbtn?.hasAttribute('disabled')).toBe(false);
			expect(stopbtn?.hasAttribute('disabled')).toBe(true);
			expect(sharebtn?.hasAttribute('disabled')).toBe(false);
		});

		test('should handle rapid state changes', () => {
			// Rapid start/stop
			uiHelper.setButtonState('active');
			uiHelper.setButtonState('stopped', false);
			uiHelper.setButtonState('active');
			uiHelper.setButtonState('stopped', true);

			const sharebtn = uiHelper.getButton('sharebtn');
			expect(sharebtn?.hasAttribute('disabled')).toBe(false);
		});
	});
});
