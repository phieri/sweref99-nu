/**
 * Design Switcher Module
 * 
 * Automatically detects the user's platform and loads the appropriate design system:
 * - Apple Liquid Glass for iOS, iPadOS, and macOS devices
 * - Android Material Design for Android devices
 * - Defaults to Liquid Glass for unsupported/unknown devices
 * 
 * Detection is performed using the User-Agent string at runtime.
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
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Detects if the user is on an Apple device
 * 
 * Checks for:
 * - iPhone
 * - iPad
 * - iPod
 * - Mac (macOS/Mac OS X)
 * 
 * @returns true if device is Apple, false otherwise
 */
function isAppleDevice(): boolean {
	const userAgent = navigator.userAgent.toLowerCase();
	
	// Check for iOS devices (iPhone, iPad, iPod)
	const isIOS = /iphone|ipad|ipod/.test(userAgent);
	
	// Check for macOS/Mac OS X
	const isMac = /macintosh|mac os x/.test(userAgent);
	
	return isIOS || isMac;
}

/**
 * Detects if the user is on an Android device
 * 
 * Checks for Android in the User-Agent string
 * 
 * @returns true if device is Android, false otherwise
 */
function isAndroidDevice(): boolean {
	const userAgent = navigator.userAgent.toLowerCase();
	return /android/.test(userAgent);
}

/**
 * Determines the appropriate design system based on platform
 * 
 * Priority:
 * 1. Android devices -> Material Design
 * 2. Apple devices -> Liquid Glass
 * 3. Unknown/Other devices -> Liquid Glass (default)
 * 
 * @returns DesignSystem to use
 */
function determineDesignSystem(): DesignSystem {
	// Check Android first (Android devices might have iOS simulators running)
	if (isAndroidDevice()) {
		return 'material-design';
	}
	
	// Apple devices get Liquid Glass
	if (isAppleDevice()) {
		return 'liquid-glass';
	}
	
	// Default to Liquid Glass for all other devices
	return 'liquid-glass';
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
	}
	
	return {
		platform,
		designSystem,
		isApple,
		isAndroid
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
