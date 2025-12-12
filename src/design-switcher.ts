/**
 * Design Switcher Module
 * 
 * Automatically detects the user's platform and loads the appropriate design system:
 * - Apple Liquid Glass for iOS, iPadOS, and macOS devices
 * - Android Material Design for Android devices  
 * - Defaults to Material Design for unsupported/unknown devices
 * 
 * Detection is performed using bowser library for accurate browser and platform detection.
 * 
 * Note: This uses bowser via CDN (loaded before this script in HTML).
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported design systems
 */
type DesignSystem = 'liquid-glass' | 'material-design';

/**
 * Platform detection result
 */
interface PlatformInfo {
	platform: string;
	designSystem: DesignSystem;
	isApple: boolean;
	isAndroid: boolean;
	userAgent: string;
}

// ============================================================================
// PLATFORM DETECTION USING BOWSER
// ============================================================================

/**
 * Safely access Bowser library (loaded via CDN)
 * Falls back to manual UA parsing if Bowser is unavailable
 */
function getBowserParser(): any {
	// Check if Bowser is available (loaded from CDN)
	if (typeof (window as any).Bowser !== 'undefined') {
		const Bowser = (window as any).Bowser;
		return Bowser.getParser(window.navigator.userAgent);
	}
	return null;
}

/**
 * Detects if the user is on an Apple device
 * 
 * Checks for:
 * - iOS (iPhone, iPad, iPod)
 * - macOS
 * 
 * @returns true if device is Apple, false otherwise
 */
function isAppleDevice(): boolean {
	const bowser = getBowserParser();
	
	if (bowser) {
		// Use bowser if available
		const osName = bowser.getOSName(true);
		return osName === 'ios' || osName === 'macos';
	}
	
	// Fallback to manual User-Agent detection
	const userAgent = navigator.userAgent.toLowerCase();
	return /iphone|ipad|ipod|macintosh|mac os x/.test(userAgent);
}

/**
 * Detects if the user is on an Android device
 * 
 * @returns true if device is Android, false otherwise
 */
function isAndroidDevice(): boolean {
	const bowser = getBowserParser();
	
	if (bowser) {
		// Use bowser if available
		const osName = bowser.getOSName(true);
		return osName === 'android';
	}
	
	// Fallback to manual User-Agent detection
	const userAgent = navigator.userAgent.toLowerCase();
	return /android/.test(userAgent);
}

/**
 * Determines the appropriate design system based on platform
 * 
 * Priority:
 * 1. Apple devices (iOS, macOS) -> Liquid Glass
 * 2. All other devices (Android, Windows, Linux, etc.) -> Material Design (default)
 * 
 * @returns DesignSystem to use
 */
function determineDesignSystem(): DesignSystem {
	// Apple devices get Liquid Glass
	if (isAppleDevice()) {
		return 'liquid-glass';
	}
	
	// Android and all other devices get Material Design as default
	// This includes Windows, Linux, ChromeOS, etc.
	return 'material-design';
}

/**
 * Gets comprehensive platform information
 * 
 * @returns PlatformInfo object with detection results
 */
function getPlatformInfo(): PlatformInfo {
	const isApple = isAppleDevice();
	const isAndroid = isAndroidDevice();
	const designSystem = determineDesignSystem();
	
	let platform = 'unknown';
	if (isApple) {
		platform = 'apple';
	} else if (isAndroid) {
		platform = 'android';
	} else {
		platform = 'other';
	}
	
	return {
		platform,
		designSystem,
		isApple,
		isAndroid,
		userAgent: navigator.userAgent
	};
}

// ============================================================================
// DESIGN SYSTEM LOADING
// ============================================================================

/**
 * Loads the appropriate CSS file for the design system
 * 
 * Dynamically creates a <link> element and adds it to the document head.
 * The stylesheet is loaded with high priority to minimize FOUC (Flash of Unstyled Content).
 * 
 * @param designSystem - The design system to load
 */
function loadDesignSystemCSS(designSystem: DesignSystem): void {
	// Create link element
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = `/${designSystem}.css`;
	link.id = 'design-system-stylesheet';
	
	// Add to head with high priority
	// Insert before the first existing stylesheet to ensure it loads early
	const firstStylesheet = document.querySelector('link[rel="stylesheet"]');
	if (firstStylesheet && firstStylesheet.parentNode) {
		firstStylesheet.parentNode.insertBefore(link, firstStylesheet.nextSibling);
	} else {
		document.head.appendChild(link);
	}
	
	// Log for debugging purposes
	console.log(`Design system loaded: ${designSystem}`);
}

/**
 * Stores the selected design system in sessionStorage
 * This allows for consistent design across page navigation
 * 
 * @param designSystem - The design system to store
 */
function storeDesignSystemPreference(designSystem: DesignSystem): void {
	try {
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem('design-system', designSystem);
		}
	} catch (error) {
		// Silently fail if sessionStorage is not available
		console.warn('Could not store design system preference:', error);
	}
}

/**
 * Retrieves the stored design system preference from sessionStorage
 * 
 * @returns The stored design system, or null if not found
 */
function getStoredDesignSystemPreference(): DesignSystem | null {
	try {
		if (typeof sessionStorage !== 'undefined') {
			const stored = sessionStorage.getItem('design-system');
			if (stored === 'liquid-glass' || stored === 'material-design') {
				return stored;
			}
		}
	} catch (error) {
		// Silently fail if sessionStorage is not available
		console.warn('Could not retrieve design system preference:', error);
	}
	return null;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the design system switcher
 * 
 * This function should be called as early as possible to minimize
 * Flash of Unstyled Content (FOUC).
 * 
 * Process:
 * 1. Check if a design system preference is already stored
 * 2. If not, detect platform and determine appropriate design
 * 3. Load the CSS file for the chosen design system
 * 4. Store the preference for future use
 */
function initializeDesignSwitcher(): void {
	// Check for stored preference first
	let designSystem = getStoredDesignSystemPreference();
	
	// If no stored preference, detect platform
	if (!designSystem) {
		const platformInfo = getPlatformInfo();
		designSystem = platformInfo.designSystem;
		
		// Store the preference
		storeDesignSystemPreference(designSystem);
		
		// Log platform detection results for debugging
		console.log('Platform detected:', {
			platform: platformInfo.platform,
			userAgent: navigator.userAgent,
			designSystem: designSystem
		});
	} else {
		console.log('Using stored design system preference:', designSystem);
	}
	
	// Load the appropriate CSS
	loadDesignSystemCSS(designSystem);
}

// ============================================================================
// MANUAL OVERRIDE (Optional)
// ============================================================================

/**
 * Allows manual override of the design system
 * Useful for testing or user preference settings
 * 
 * @param designSystem - The design system to switch to
 */
function switchDesignSystem(designSystem: DesignSystem): void {
	// Remove existing design system stylesheet
	const existingStylesheet = document.getElementById('design-system-stylesheet');
	if (existingStylesheet && existingStylesheet.parentNode) {
		existingStylesheet.parentNode.removeChild(existingStylesheet);
	}
	
	// Load new design system
	loadDesignSystemCSS(designSystem);
	
	// Store preference
	storeDesignSystemPreference(designSystem);
	
	console.log('Design system switched to:', designSystem);
}

// ============================================================================
// EXPORTS AND AUTO-INITIALIZATION
// ============================================================================

// Export functions for potential external use
if (typeof window !== 'undefined') {
	// Make functions available globally for debugging/testing
	(window as any).designSwitcher = {
		getPlatformInfo,
		switchDesignSystem,
		isAppleDevice,
		isAndroidDevice
	};
}

// Auto-initialize when the script loads
// This ensures the design system is applied as early as possible
initializeDesignSwitcher();
