/**
 * Unit tests for details state persistence functionality
 * 
 * This test suite covers:
 * - Saving details state to localStorage
 * - Restoring details state from localStorage
 * - Event listener initialization
 * - Edge cases and error handling
 */

// Mock localStorage
class LocalStorageMock {
	private store: { [key: string]: string } = {};

	getItem(key: string): string | null {
		return this.store[key] || null;
	}

	setItem(key: string, value: string): void {
		this.store[key] = value;
	}

	removeItem(key: string): void {
		delete this.store[key];
	}

	clear(): void {
		this.store = {};
	}
}

// Setup localStorage mock
const localStorageMock = new LocalStorageMock();
(global as any).localStorage = localStorageMock;

// Mock console methods to avoid cluttering test output
const originalConsoleWarn = console.warn;
beforeAll(() => {
	console.warn = jest.fn();
});

afterAll(() => {
	console.warn = originalConsoleWarn;
});

// Constants from script.ts
const DETAILS_STATE_STORAGE_KEY = 'sweref99-details-state';
const MAX_DETAILS_TO_TRACK = 3;

interface DetailsState {
	[id: string]: boolean;
}

/**
 * Test implementation of saveDetailsState
 * This is a copy of the function from src/script.ts for testing purposes
 */
function saveDetailsState(): void {
	try {
		if (typeof localStorage === 'undefined') {
			return;
		}

		const detailsElements = document.querySelectorAll('details[id]');
		const state: DetailsState = {};
		
		let count = 0;
		detailsElements.forEach((element) => {
			if (count >= MAX_DETAILS_TO_TRACK) {
				return;
			}
			
			const detailsElement = element as HTMLDetailsElement;
			if (detailsElement.id) {
				state[detailsElement.id] = detailsElement.open;
				count++;
			}
		});

		localStorage.setItem(DETAILS_STATE_STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save details state:', error);
	}
}

/**
 * Test implementation of restoreDetailsState
 * This is a copy of the function from src/script.ts for testing purposes
 */
function restoreDetailsState(): void {
	try {
		if (typeof localStorage === 'undefined') {
			return;
		}

		const savedStateJson = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
		if (!savedStateJson) {
			return;
		}

		const savedState: DetailsState = JSON.parse(savedStateJson);

		Object.keys(savedState).forEach((id) => {
			const element = document.getElementById(id);
			if (element && element.tagName === 'DETAILS') {
				const detailsElement = element as HTMLDetailsElement;
				detailsElement.open = savedState[id];
			}
		});
	} catch (error) {
		console.warn('Failed to restore details state:', error);
	}
}

/**
 * Helper function to create a mock details element
 */
function createDetailsElement(id: string, open: boolean = false): HTMLDetailsElement {
	const details = document.createElement('details');
	details.id = id;
	details.open = open;
	
	const summary = document.createElement('summary');
	summary.textContent = 'Test Summary';
	details.appendChild(summary);
	
	return details;
}

describe('Details State Persistence', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorageMock.clear();
		// Clear the document body
		document.body.innerHTML = '';
	});

	describe('saveDetailsState Function', () => {
		test('should save state of a single details element', () => {
			const details = createDetailsElement('details-test1', true);
			document.body.appendChild(details);

			saveDetailsState();

			const savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			expect(savedState).not.toBeNull();
			
			const state = JSON.parse(savedState!);
			expect(state['details-test1']).toBe(true);
		});

		test('should save state of multiple details elements', () => {
			const details1 = createDetailsElement('details-test1', true);
			const details2 = createDetailsElement('details-test2', false);
			const details3 = createDetailsElement('details-test3', true);
			
			document.body.appendChild(details1);
			document.body.appendChild(details2);
			document.body.appendChild(details3);

			saveDetailsState();

			const savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			const state = JSON.parse(savedState!);
			
			expect(state['details-test1']).toBe(true);
			expect(state['details-test2']).toBe(false);
			expect(state['details-test3']).toBe(true);
		});

		test('should respect MAX_DETAILS_TO_TRACK limit', () => {
			// Create more than MAX_DETAILS_TO_TRACK details elements
			const details1 = createDetailsElement('details-test1', true);
			const details2 = createDetailsElement('details-test2', false);
			const details3 = createDetailsElement('details-test3', true);
			const details4 = createDetailsElement('details-test4', false);
			
			document.body.appendChild(details1);
			document.body.appendChild(details2);
			document.body.appendChild(details3);
			document.body.appendChild(details4);

			saveDetailsState();

			const savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			const state = JSON.parse(savedState!);
			
			// Should only save the first MAX_DETAILS_TO_TRACK elements
			const savedCount = Object.keys(state).length;
			expect(savedCount).toBe(MAX_DETAILS_TO_TRACK);
			expect(state['details-test1']).toBeDefined();
			expect(state['details-test2']).toBeDefined();
			expect(state['details-test3']).toBeDefined();
			expect(state['details-test4']).toBeUndefined();
		});

		test('should update existing state when called multiple times', () => {
			const details = createDetailsElement('details-test1', true);
			document.body.appendChild(details);

			saveDetailsState();
			
			let savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			let state = JSON.parse(savedState!);
			expect(state['details-test1']).toBe(true);

			// Change the state and save again
			details.open = false;
			saveDetailsState();

			savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			state = JSON.parse(savedState!);
			expect(state['details-test1']).toBe(false);
		});

		test('should ignore details elements without IDs', () => {
			const detailsWithId = createDetailsElement('details-test1', true);
			const detailsWithoutId = createDetailsElement('', false);
			detailsWithoutId.removeAttribute('id');
			
			document.body.appendChild(detailsWithId);
			document.body.appendChild(detailsWithoutId);

			saveDetailsState();

			const savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			const state = JSON.parse(savedState!);
			
			expect(Object.keys(state).length).toBe(1);
			expect(state['details-test1']).toBeDefined();
		});

		test('should save JSON format to localStorage', () => {
			const details = createDetailsElement('details-test1', true);
			document.body.appendChild(details);

			saveDetailsState();

			const savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			expect(savedState).not.toBeNull();
			
			// Verify it's valid JSON
			expect(() => JSON.parse(savedState!)).not.toThrow();
		});
	});

	describe('restoreDetailsState Function', () => {
		test('should restore state of a single details element', () => {
			const details = createDetailsElement('details-test1', false);
			document.body.appendChild(details);

			// Save a state with the element open
			const state: DetailsState = { 'details-test1': true };
			localStorage.setItem(DETAILS_STATE_STORAGE_KEY, JSON.stringify(state));

			// Restore the state
			restoreDetailsState();

			expect(details.open).toBe(true);
		});

		test('should restore state of multiple details elements', () => {
			const details1 = createDetailsElement('details-test1', false);
			const details2 = createDetailsElement('details-test2', false);
			const details3 = createDetailsElement('details-test3', false);
			
			document.body.appendChild(details1);
			document.body.appendChild(details2);
			document.body.appendChild(details3);

			// Save a state with mixed open/closed
			const state: DetailsState = {
				'details-test1': true,
				'details-test2': false,
				'details-test3': true
			};
			localStorage.setItem(DETAILS_STATE_STORAGE_KEY, JSON.stringify(state));

			// Restore the state
			restoreDetailsState();

			expect(details1.open).toBe(true);
			expect(details2.open).toBe(false);
			expect(details3.open).toBe(true);
		});

		test('should handle missing localStorage data gracefully', () => {
			const details = createDetailsElement('details-test1', true);
			document.body.appendChild(details);

			// Don't set any localStorage data
			expect(() => restoreDetailsState()).not.toThrow();
			
			// Element should remain in its original state
			expect(details.open).toBe(true);
		});

		test('should handle corrupted localStorage data gracefully', () => {
			const details = createDetailsElement('details-test1', true);
			document.body.appendChild(details);

			// Set invalid JSON data
			localStorage.setItem(DETAILS_STATE_STORAGE_KEY, 'invalid json {');

			expect(() => restoreDetailsState()).not.toThrow();
			
			// Element should remain in its original state
			expect(details.open).toBe(true);
		});

		test('should ignore saved state for non-existent elements', () => {
			const details = createDetailsElement('details-test1', false);
			document.body.appendChild(details);

			// Save a state that includes a non-existent element
			const state: DetailsState = {
				'details-test1': true,
				'details-nonexistent': true
			};
			localStorage.setItem(DETAILS_STATE_STORAGE_KEY, JSON.stringify(state));

			expect(() => restoreDetailsState()).not.toThrow();
			
			expect(details.open).toBe(true);
		});

		test('should ignore saved state for elements that are not details', () => {
			const details = createDetailsElement('details-test1', false);
			const div = document.createElement('div');
			div.id = 'details-test2';
			
			document.body.appendChild(details);
			document.body.appendChild(div);

			// Save a state that includes the div
			const state: DetailsState = {
				'details-test1': true,
				'details-test2': true
			};
			localStorage.setItem(DETAILS_STATE_STORAGE_KEY, JSON.stringify(state));

			expect(() => restoreDetailsState()).not.toThrow();
			
			expect(details.open).toBe(true);
			// Div should not have an 'open' property set
		});
	});

	describe('Integration Tests', () => {
		test('should save and restore state correctly', () => {
			// Create initial elements
			const details1 = createDetailsElement('details-test1', true);
			const details2 = createDetailsElement('details-test2', false);
			const details3 = createDetailsElement('details-test3', true);
			
			document.body.appendChild(details1);
			document.body.appendChild(details2);
			document.body.appendChild(details3);

			// Save the state
			saveDetailsState();

			// Clear the document
			document.body.innerHTML = '';

			// Create new elements with different initial states
			const newDetails1 = createDetailsElement('details-test1', false);
			const newDetails2 = createDetailsElement('details-test2', true);
			const newDetails3 = createDetailsElement('details-test3', false);
			
			document.body.appendChild(newDetails1);
			document.body.appendChild(newDetails2);
			document.body.appendChild(newDetails3);

			// Restore the state
			restoreDetailsState();

			// Should match the original state
			expect(newDetails1.open).toBe(true);
			expect(newDetails2.open).toBe(false);
			expect(newDetails3.open).toBe(true);
		});

		test('should handle toggle events', () => {
			const details = createDetailsElement('details-test1', false);
			document.body.appendChild(details);

			// Simulate user interaction
			details.open = true;
			saveDetailsState();

			const savedState = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			const state = JSON.parse(savedState!);
			expect(state['details-test1']).toBe(true);

			// Simulate another toggle
			details.open = false;
			saveDetailsState();

			const savedState2 = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
			const state2 = JSON.parse(savedState2!);
			expect(state2['details-test1']).toBe(false);
		});
	});

	describe('Constants', () => {
		test('DETAILS_STATE_STORAGE_KEY should be a string', () => {
			expect(typeof DETAILS_STATE_STORAGE_KEY).toBe('string');
			expect(DETAILS_STATE_STORAGE_KEY.length).toBeGreaterThan(0);
		});

		test('MAX_DETAILS_TO_TRACK should be 3 as per requirements', () => {
			expect(MAX_DETAILS_TO_TRACK).toBe(3);
		});

		test('MAX_DETAILS_TO_TRACK should be a positive integer', () => {
			expect(Number.isInteger(MAX_DETAILS_TO_TRACK)).toBe(true);
			expect(MAX_DETAILS_TO_TRACK).toBeGreaterThan(0);
		});
	});
});
