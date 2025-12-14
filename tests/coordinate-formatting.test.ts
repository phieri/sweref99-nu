/**
 * Unit tests for coordinate formatting
 * 
 * This test suite covers the extra space formatting for E coordinate
 * to ensure proper alignment between N (7 digits) and E (6 digits)
 */

/**
 * Mock DOM elements for testing
 */
class MockElement {
	private attributes: Map<string, string> = new Map();
	private _innerHTML: string = '';
	private _textContent: string = '';

	get innerHTML(): string {
		return this._innerHTML;
	}

	set innerHTML(value: string) {
		this._innerHTML = value;
		// Convert HTML to text content (strip HTML entities and tags)
		this._textContent = value
			.replace(/&nbsp;/g, ' ')
			.replace(/&deg;/g, '°')
			.replace(/&pm;/g, '±')
			.replace(/<[^>]*>/g, '');
	}

	get textContent(): string {
		return this._textContent;
	}

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
		return this.attributes.get(name) ?? null;
	}
}

/**
 * Simplified UIHelper for testing coordinate formatting
 */
class TestUIHelper {
	private elements: {
		swerefn: MockElement | null;
		swerefe: MockElement | null;
	};

	constructor() {
		this.elements = {
			swerefn: new MockElement(),
			swerefe: new MockElement()
		};
	}

	/**
	 * Updates coordinate displays for SWEREF 99
	 */
	updateCoordinates(northing: number, easting: number): void {
		const { swerefn, swerefe } = this.elements;

		if (swerefn) swerefn.innerHTML = `N&nbsp;${Math.round(northing).toString().replace(".", ",")}`;
		if (swerefe) swerefe.innerHTML = `E&nbsp;&nbsp;${Math.round(easting).toString().replace(".", ",")}`;
	}

	/**
	 * Gets formatted text for sharing coordinates
	 * Removes the extra space after "E" that's used for alignment in the UI
	 */
	getShareText(): string {
		const { swerefn, swerefe } = this.elements;
		const nText = swerefn?.textContent ?? '';
		const eText = swerefe?.textContent ?? '';
		// Remove the extra space after "E" that's used for alignment
		const eTextNormalized = eText.replace(/^E\s\s/, 'E ');
		return `${nText} ${eTextNormalized} (SWEREF 99 TM)`;
	}

	getElement(name: 'swerefn' | 'swerefe'): MockElement | null {
		return this.elements[name];
	}
}

describe('Coordinate Formatting', () => {
	describe('Display formatting with alignment', () => {
		test('should add extra space after E for alignment', () => {
			const uiHelper = new TestUIHelper();
			
			// Stockholm coordinates (approximately)
			uiHelper.updateCoordinates(6580123, 674456);
			
			const swerefn = uiHelper.getElement('swerefn');
			const swerefe = uiHelper.getElement('swerefe');
			
			// Check HTML contains the proper spacing
			expect(swerefn?.innerHTML).toBe('N&nbsp;6580123');
			expect(swerefe?.innerHTML).toBe('E&nbsp;&nbsp;674456');
		});

		test('should display with proper text content', () => {
			const uiHelper = new TestUIHelper();
			
			uiHelper.updateCoordinates(6580123, 674456);
			
			const swerefn = uiHelper.getElement('swerefn');
			const swerefe = uiHelper.getElement('swerefe');
			
			// Check text content has spaces converted
			expect(swerefn?.textContent).toBe('N 6580123');
			expect(swerefe?.textContent).toBe('E  674456'); // Two spaces after E
		});

		test('should handle 7-digit northing values', () => {
			const uiHelper = new TestUIHelper();
			
			// Maximum northing for Sweden (northern Lapland)
			uiHelper.updateCoordinates(7654321, 512345);
			
			const swerefn = uiHelper.getElement('swerefn');
			expect(swerefn?.textContent).toBe('N 7654321');
		});

		test('should handle 6-digit easting values', () => {
			const uiHelper = new TestUIHelper();
			
			// Typical easting for Sweden
			uiHelper.updateCoordinates(6580123, 512345);
			
			const swerefe = uiHelper.getElement('swerefe');
			expect(swerefe?.textContent).toBe('E  512345'); // Two spaces after E
		});

		test('should handle minimum Swedish coordinates', () => {
			const uiHelper = new TestUIHelper();
			
			// Southern Sweden (approximately Malmö area)
			uiHelper.updateCoordinates(6155000, 375000);
			
			const swerefn = uiHelper.getElement('swerefn');
			const swerefe = uiHelper.getElement('swerefe');
			
			expect(swerefn?.textContent).toBe('N 6155000');
			expect(swerefe?.textContent).toBe('E  375000');
		});
	});

	describe('Share text formatting', () => {
		test('should remove extra space from E coordinate in share text', () => {
			const uiHelper = new TestUIHelper();
			
			uiHelper.updateCoordinates(6580123, 674456);
			
			const shareText = uiHelper.getShareText();
			
			// Share text should have single space after E
			expect(shareText).toBe('N 6580123 E 674456 (SWEREF 99 TM)');
		});

		test('should format share text with proper spacing', () => {
			const uiHelper = new TestUIHelper();
			
			uiHelper.updateCoordinates(7654321, 512345);
			
			const shareText = uiHelper.getShareText();
			
			expect(shareText).toBe('N 7654321 E 512345 (SWEREF 99 TM)');
		});

		test('should handle multiple coordinates in share text', () => {
			const uiHelper = new TestUIHelper();
			
			// Test 1
			uiHelper.updateCoordinates(6580123, 674456);
			expect(uiHelper.getShareText()).toBe('N 6580123 E 674456 (SWEREF 99 TM)');
			
			// Test 2 - update with new coordinates
			uiHelper.updateCoordinates(6155000, 375000);
			expect(uiHelper.getShareText()).toBe('N 6155000 E 375000 (SWEREF 99 TM)');
		});

		test('should not affect N coordinate in share text', () => {
			const uiHelper = new TestUIHelper();
			
			uiHelper.updateCoordinates(6580123, 674456);
			
			const shareText = uiHelper.getShareText();
			
			// N coordinate should have single space
			expect(shareText).toContain('N 6580123');
			// E coordinate should have single space (not double)
			expect(shareText).toContain('E 674456');
			// Should not contain double space after E
			expect(shareText).not.toContain('E  674456');
		});
	});

	describe('Alignment verification', () => {
		test('should align N and E coordinates visually', () => {
			const uiHelper = new TestUIHelper();
			
			// 7-digit N and 6-digit E
			uiHelper.updateCoordinates(6580123, 674456);
			
			const swerefn = uiHelper.getElement('swerefn');
			const swerefe = uiHelper.getElement('swerefe');
			
			const nText = swerefn?.textContent ?? '';
			const eText = swerefe?.textContent ?? '';
			
			// Count spaces after coordinate prefix
			const nSpaces = (nText.match(/^N\s+/)?.[0].length ?? 0) - 1;
			const eSpaces = (eText.match(/^E\s+/)?.[0].length ?? 0) - 1;
			
			// E should have one more space than N
			expect(eSpaces).toBe(nSpaces + 1);
		});

		test('should result in same character count for coordinate display', () => {
			const uiHelper = new TestUIHelper();
			
			// 7-digit N and 6-digit E
			uiHelper.updateCoordinates(6580123, 674456);
			
			const swerefn = uiHelper.getElement('swerefn');
			const swerefe = uiHelper.getElement('swerefe');
			
			// Both should have same length when displayed
			// N has 1 space, E has 2 spaces, so total length is same
			// "N 6580123" = 9 chars
			// "E  674456" = 9 chars
			expect(swerefn?.textContent.length).toBe(9);
			expect(swerefe?.textContent.length).toBe(9);
		});
	});
});
