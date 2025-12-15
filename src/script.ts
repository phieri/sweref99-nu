// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

declare const proj4: any;

/**
 * Represents coordinates in the SWEREF 99 TM coordinate system
 */
interface SwerefCoordinates {
	northing: number;
	easting: number;
}

/**
 * Represents the correction needed for ITRF to ETRS89 continental drift
 */
interface Itrf2Etrs89Correction {
	dn: number; // North correction in meters
	de: number; // East correction in meters
}

/**
 * Speed unit types for display
 */
type SpeedUnit = 'm/s' | 'km/h' | 'mph';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Geographic bounds for Sweden
 * Used to validate if coordinates are within Swedish territory
 */
const SWEDEN_BOUNDS = {
	MIN_LATITUDE: 55,
	MAX_LATITUDE: 69,
	MIN_LONGITUDE: 10,
	MAX_LONGITUDE: 24
} as const;

/**
 * Position accuracy threshold (meters)
 * Smartphone GPS typically achieves 3-5m accuracy in optimal conditions and 10-20m in real-world
 * scenarios with signal obstructions. SWEREF 99 transformation accuracy is within 1m.
 * A 5m threshold represents typical optimal smartphone GPS accuracy and is appropriate for
 * general navigation and coordinate display purposes.
 * Sources: Smartphone GNSS research (Link et al., 2025; DXOMark GPS testing)
 */
const ACCURACY_THRESHOLD_METERS: number = 5;

/**
 * Speed threshold (m/s) for distinguishing stationary/walking from faster movement
 * Typical pedestrian walking speed ranges from 1.1-1.4 m/s (4-5 km/h). GPS positioning
 * when stationary can show spurious movement due to signal noise. A threshold of 1.4 m/s
 * corresponds to the upper end of normal walking speed and effectively distinguishes
 * between pedestrian movement and faster travel (cycling, driving, etc.).
 * Sources: Pedestrian speed analysis (MDPI Sustainability, 2024); GPS accuracy studies
 */
const SPEED_THRESHOLD_MS: number = 1.4;

/**
 * Delay before showing loading spinner (milliseconds)
 * Prevents UI flicker for fast position updates
 */
const SPINNER_DELAY_MS: number = 5000;

/**
 * ETRS89 and SWEREF 99 epoch constants
 * Used for calculating continental drift correction
 */
const ETRS89_EPOCH: number = 1989.0;
const SWEREF99_EPOCH: number = 1999.5;

/**
 * European plate velocity parameters
 * 
 * The European tectonic plate moves approximately 2.5 cm/year relative to ITRF
 * in a northeast direction (approximately 25° from north). This causes a 
 * time-dependent difference between WGS84 (realized via ITRF) and SWEREF 99
 * (ETRS89 fixed at epoch 1999.5).
 * 
 * These values are used to calculate drift correction between the moving ITRF
 * frame (used by GPS/WGS84) and the fixed ETRS89 frame (used by SWEREF 99).
 * 
 * Values verified against:
 * - EUREF Technical Notes on European plate motion
 * - Lantmäteriet technical documentation on SWEREF 99
 * 
 * @see SWEREF99-DEFINITION.md - Section "Continental Drift Correction"
 * @see http://www.euref.eu/ - European Reference Frame
 */
const PLATE_VELOCITY = {
	METERS_PER_YEAR: 0.025, // 2.5 cm/år
	AZIMUTH_DEGREES: 25 // grader från norr, öster är positiv
} as const;

/**
 * Geolocation API options
 */
const GEOLOCATION_OPTIONS = {
	enableHighAccuracy: true,
	maximumAge: 20000,
	timeout: 28000,
} as const;

/**
 * Geolocation test options for restore operations
 */
const GEOLOCATION_TEST_OPTIONS = {
	timeout: 5000,
	maximumAge: 60000
} as const;

/**
 * UI text constants (Swedish)
 */
const UI_TEXT = {
	ERROR_NO_POSITION: "Fel: Ingen position tillgänglig. Kontrollera inställningarna för platstjänster i operativsystem och webbläsare!",
	ERROR_NO_POSITION_TITLE: "Positioneringsfel",
	NOT_AVAILABLE: "Ej&nbsp;tillgängligt",
	WARNING_NOT_IN_SWEDEN: "Varning: SWEREF 99 är bara användbart i Sverige.",
	WARNING_NOT_IN_SWEDEN_TITLE: "Position utanför Sverige",
	HELP_URL: "https://sweref99.nu/om.html"
} as const;

/**
 * Notification duration (milliseconds)
 */
const NOTIFICATION_DURATION = {
	DEFAULT: 5000,
	ERROR: 7000
} as const;

/**
 * Speed unit conversion factors (from m/s)
 */
const SPEED_CONVERSION = {
	'm/s': 1,
	'km/h': 3.6,
	'mph': 2.23694
} as const;

/**
 * Speed unit order for cycling through units
 */
const SPEED_UNIT_ORDER: SpeedUnit[] = ['m/s', 'km/h', 'mph'];

/**
 * LocalStorage key for speed unit preference
 */
const SPEED_UNIT_STORAGE_KEY = 'sweref99-speed-unit';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a position is within Swedish territory
 * @param pos - GeolocationPosition to check
 * @returns true if position is within Sweden's approximate bounds
 */
function isInSweden(pos: GeolocationPosition): boolean {
	const { latitude, longitude } = pos.coords;
	return (
		latitude >= SWEDEN_BOUNDS.MIN_LATITUDE &&
		latitude <= SWEDEN_BOUNDS.MAX_LATITUDE &&
		longitude >= SWEDEN_BOUNDS.MIN_LONGITUDE &&
		longitude <= SWEDEN_BOUNDS.MAX_LONGITUDE
	);
}

/**
 * Convert speed from m/s to the specified unit
 * @param speedMs - Speed in meters per second
 * @param unit - Target unit for conversion
 * @returns Converted speed value
 */
function convertSpeed(speedMs: number, unit: SpeedUnit): number {
	return speedMs * SPEED_CONVERSION[unit];
}

/**
 * Get the next speed unit in the cycle
 * @param currentUnit - Current speed unit
 * @returns Next speed unit in the cycle
 */
function getNextSpeedUnit(currentUnit: SpeedUnit): SpeedUnit {
	const currentIndex = SPEED_UNIT_ORDER.indexOf(currentUnit);
	const nextIndex = (currentIndex + 1) % SPEED_UNIT_ORDER.length;
	return SPEED_UNIT_ORDER[nextIndex];
}

/**
 * Get the saved speed unit preference from localStorage
 * @returns Saved speed unit or default 'm/s'
 */
function getSavedSpeedUnit(): SpeedUnit {
	try {
		if (typeof localStorage === 'undefined') {
			return 'm/s';
		}
		const saved = localStorage.getItem(SPEED_UNIT_STORAGE_KEY);
		if (saved && SPEED_UNIT_ORDER.includes(saved as SpeedUnit)) {
			return saved as SpeedUnit;
		}
	} catch (error) {
		console.warn('Failed to get saved speed unit:', error);
	}
	return 'm/s';
}

/**
 * Save the speed unit preference to localStorage
 * @param unit - Speed unit to save
 */
function saveSpeedUnit(unit: SpeedUnit): void {
	try {
		if (typeof localStorage === 'undefined') {
			return;
		}
		localStorage.setItem(SPEED_UNIT_STORAGE_KEY, unit);
	} catch (error) {
		console.warn('Failed to save speed unit:', error);
	}
}

/**
 * Beräkna tidskorrigering för ITRF/ETRS89-drift
 * 
 * WGS84 (realiserat via ITRF) och SWEREF 99 (ETRS89 epoch 1999.5) 
 * skiljer sig med tiden pga. kontinentaldrift i Europa.
 * Denna beräkning görs en gång vid appstart.
 * 
 * @returns Correction values for northing and easting in meters
 */
function calculateItrf2Etrs89Correction(): Itrf2Etrs89Correction {
	// Beräkna aktuellt år (decimalår)
	const now = new Date();
	const yearStart = new Date(now.getFullYear(), 0, 1);
	const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
	const yearFraction: number = (now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime());
	const currentEpoch: number = now.getFullYear() + yearFraction;
	
	// Tid sedan ETRS89 fixerades
	const yearsSinceEtrs89: number = currentEpoch - ETRS89_EPOCH;
	
	// Konvertera till nord- och östkomponenter
	const azimuthRad: number = (PLATE_VELOCITY.AZIMUTH_DEGREES * Math.PI) / 180;
	const northVelocity: number = PLATE_VELOCITY.METERS_PER_YEAR * Math.cos(azimuthRad);
	const eastVelocity: number = PLATE_VELOCITY.METERS_PER_YEAR * Math.sin(azimuthRad);
	
	// Total förskjutning sedan ETRS89 epoch
	const totalNorthShift: number = northVelocity * yearsSinceEtrs89;
	const totalEastShift: number = eastVelocity * yearsSinceEtrs89;
	
	return {
		dn: totalNorthShift,
		de: totalEastShift
	};
}

// Beräkna korrigeringen en gång vid appstart
const itrf2Etrs89Correction: Itrf2Etrs89Correction = calculateItrf2Etrs89Correction();

/**
 * Transforms WGS84 coordinates to SWEREF 99 TM using PROJ4JS
 * 
 * SWEREF 99 TM (EPSG:3006) is the Swedish national coordinate reference system
 * based on ETRS89 at epoch 1999.5. It uses a Transverse Mercator projection
 * covering all of Sweden with a single zone (UTM zone 33, central meridian 15°E).
 * 
 * @param lat - Latitude in WGS84 decimal degrees
 * @param lon - Longitude in WGS84 decimal degrees
 * @returns SWEREF 99 TM coordinates with ITRF/ETRS89 drift correction applied
 * 
 * @see SWEREF99-DEFINITION.md for complete verification and references
 * @see https://epsg.io/3006 - Official EPSG registry entry
 * @see https://www.lantmateriet.se - Lantmäteriet (Swedish mapping authority)
 */
function wgs84_to_sweref99tm(lat: number, lon: number): SwerefCoordinates {
	try {
		// Check if proj4 library is available
		if (typeof proj4 === 'undefined') {
			console.warn("SWEREF 99 transformation not available - proj4 library not loaded");
			return { northing: 0, easting: 0 };
		}

		// Define coordinate systems if not already defined
		// WGS84 is built-in as 'EPSG:4326'
		// 
		// SWEREF 99 TM (EPSG:3006) PROJ Definition
		// =========================================
		// This definition has been verified against official sources:
		// - EPSG Registry (https://epsg.io/3006)
		// - Lantmäteriet official documentation
		// - SpatialReference.org (https://spatialreference.org/ref/epsg/3006/)
		// 
		// Parameter breakdown:
		// +proj=utm          : Universal Transverse Mercator projection
		// +zone=33           : UTM zone 33 (central meridian 15°E, covers Sweden)
		// +ellps=GRS80       : Geodetic Reference System 1980 ellipsoid
		// +towgs84=0,0,0,... : Zero transformation (ETRS89 ≈ WGS84 at epoch level)
		// +units=m           : Coordinates in meters
		// +no_defs           : Don't use proj_def.dat defaults
		// +type=crs          : Modern PROJ convention for CRS definition
		// 
		// See SWEREF99-DEFINITION.md for complete verification documentation
		if (!proj4.defs('EPSG:3006')) {
				proj4.defs('EPSG:3006', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
		}

		// Transform coordinates using proj4
		// Input: [longitude, latitude] in WGS84 (EPSG:4326)
		// Output: [easting, northing] in SWEREF 99 TM (EPSG:3006)
		const result = proj4('EPSG:4326', 'EPSG:3006', [lon, lat]);

		let easting: number = result[0];
		let northing: number = result[1];

		// Applicera tidskorrigering för ITRF->ETRS89 drift
		// Detta kompenserar för att WGS84 (ITRF-realisering) och SWEREF 99 (ETRS89)
		// skiljer sig åt och att skillnaden ökar med tiden
		northing += itrf2Etrs89Correction.dn;
		easting += itrf2Etrs89Correction.de;

		// Validate the result
		if (isNaN(northing) || isNaN(easting)) {
			console.warn(`Invalid coordinate transformation result for lat=${lat}, lon=${lon}:`, { northing, easting });
			return { northing: 0, easting: 0 };
		}

		return { northing, easting };
	} catch (error) {
		console.error("Error in coordinate transformation:", error);
		return { northing: 0, easting: 0 };
	}
}

// ============================================================================
// DOM ELEMENTS AND UI REFERENCES
// ============================================================================

const uncert: HTMLElement | null    = document.getElementById("uncert");
const speed: HTMLElement | null     = document.getElementById("speed");
const timestamp: HTMLElement | null = document.getElementById("timestamp");
const swerefn: HTMLElement | null   = document.getElementById("sweref-n");
const swerefe: HTMLElement | null   = document.getElementById("sweref-e");
const wgs84n: HTMLElement | null    = document.getElementById("wgs84-n");
const wgs84e: HTMLElement | null    = document.getElementById("wgs84-e");
const posbtn: HTMLElement | null    = document.getElementById("pos-btn");
const sharebtn: HTMLElement | null  = document.getElementById("share-btn");
const stopbtn: HTMLElement | null   = document.getElementById("stop-btn");

// Hämta dialog-elementet
const notificationDialog = document.getElementById("notification-dialog") as HTMLDialogElement;
const notificationContent = document.getElementById("notification-content") as HTMLElement;
const notificationHeader = document.getElementById("notification-header") as HTMLElement | null;
const notificationTitle = document.getElementById("notification-title") as HTMLElement | null;

// Skapa tidsstämpelformatterare en gång för återanvändning
const timeFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('sv-SE', {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false
});

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Visar meddelanden via Dialog API
 * 
 * @param message - Message to display
 * @param duration - Duration in milliseconds (default: 5000)
 * @param title - Optional title for the notification
 */
function showNotification(message: string, duration: number = NOTIFICATION_DURATION.DEFAULT, title?: string): void {
	if (!notificationDialog || !notificationContent) {
		window.alert(message);
		return;
	}

	// Stäng eventuellt öppet dialog först
	if (notificationDialog.open) {
		notificationDialog.close();
	}

	// Sätt rubrik om angiven
	if (title && notificationHeader && notificationTitle) {
		notificationTitle.textContent = title;
		notificationTitle.removeAttribute('hidden');
		notificationHeader.style.display = '';
	} else if (!title && notificationHeader && notificationTitle) {
		notificationHeader.style.display = 'none';
		notificationTitle.setAttribute('hidden', '');
	}

	// Sätt meddelande och visa dialog
	notificationContent.textContent = message;
	notificationDialog.showModal();
	
	// Dölj automatiskt efter angiven tid
	setTimeout(() => {
		if (notificationDialog.open) {
			notificationDialog.close();
		}
	}, duration);
	
	// Stäng dialog vid klick utanför (backdrop)
	notificationDialog.addEventListener('click', function(event) {
		const rect = notificationDialog.getBoundingClientRect();
		const isInDialog = (
			rect.top <= event.clientY &&
			event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX &&
			event.clientX <= rect.left + rect.width
		);
		if (!isInDialog) {
			notificationDialog.close();
		}
	});
}

// ============================================================================
// UI HELPER CLASS
// ============================================================================

/**
 * UIHelper - centraliserar all DOM-manipulation och UI-state management
 * 
 * Design Pattern: Helper/Utility Class med Facade-pattern för DOM-manipulation
 * 
 * Denna klass följer etablerade mönster från:
 * - **Facade Pattern**: Ger ett förenklat interface till DOM-manipulation och state management
 *   (källa: "Design Patterns: Elements of Reusable Object-Oriented Software", Gang of Four)
 * - **Helper/Utility Class Pattern**: Kapslar in återanvändbar logik för UI-operationer
 *   (vanligt i moderna JavaScript/TypeScript applikationer)
 * 
 * Fördelar med detta mönster:
 * - Separation of Concerns: Isolerar all UI-logik från affärslogik
 * - Single Responsibility: Klassen har ett enda ansvar - hantera UI-uppdateringar
 * - DRY (Don't Repeat Yourself): Eliminerar duplicerad DOM-manipuleringskod
 * - Testbarhet: UI-logik kan testas isolerat från resten av applikationen
 * - Null Safety: Konsekvent null-hantering för alla DOM-element
 * 
 * Liknande implementationer finns i:
 * - React's rendering layer (abstraherar DOM-manipulation)
 * - Angular's ViewChild/Renderer2 (kapslar DOM-åtkomst)
 * - Vue's template bindings (centraliserad UI-uppdatering)
 */
class UIHelper {
	private elements: {
		uncert: HTMLElement | null;
		speed: HTMLElement | null;
		timestamp: HTMLElement | null;
		swerefn: HTMLElement | null;
		swerefe: HTMLElement | null;
		wgs84n: HTMLElement | null;
		wgs84e: HTMLElement | null;
		posbtn: HTMLElement | null;
		sharebtn: HTMLElement | null;
		stopbtn: HTMLElement | null;
	};
	private currentSpeedUnit: SpeedUnit;

	constructor() {
		this.elements = {
			uncert: document.getElementById("uncert"),
			speed: document.getElementById("speed"),
			timestamp: document.getElementById("timestamp"),
			swerefn: document.getElementById("sweref-n"),
			swerefe: document.getElementById("sweref-e"),
			wgs84n: document.getElementById("wgs84-n"),
			wgs84e: document.getElementById("wgs84-e"),
			posbtn: document.getElementById("pos-btn"),
			sharebtn: document.getElementById("share-btn"),
			stopbtn: document.getElementById("stop-btn")
		};
		this.currentSpeedUnit = getSavedSpeedUnit();
	}

	/**
	 * Updates the accuracy display and applies styling based on threshold
	 */
	updateAccuracy(accuracy: number, threshold: number): void {
		const { uncert } = this.elements;
		if (!uncert) return;

		uncert.innerHTML = `&pm;${Math.round(accuracy)}&nbsp;m`;
		if (accuracy > threshold) {
			uncert.classList.add("outofrange");
		} else {
			uncert.classList.remove("outofrange");
		}
	}

	/**
	 * Updates the speed display and applies styling based on threshold
	 */
	updateSpeed(speed: number | null, threshold: number): void {
		const { speed: speedEl } = this.elements;
		if (!speedEl) return;

		if (speed !== null) {
			const convertedSpeed = convertSpeed(speed, this.currentSpeedUnit);
			const speedValue = Math.round(convertedSpeed);
			speedEl.innerHTML = `${speedValue}&nbsp;${this.currentSpeedUnit}`;
		} else {
			speedEl.innerHTML = `?&nbsp;${this.currentSpeedUnit}`;
		}
		
		if (speed !== null && speed > threshold) {
			speedEl.classList.add("outofrange");
		} else {
			speedEl.classList.remove("outofrange");
		}
	}

	/**
	 * Cycle to the next speed unit and update display
	 */
	cycleSpeedUnit(speed: number | null, threshold: number): void {
		this.currentSpeedUnit = getNextSpeedUnit(this.currentSpeedUnit);
		saveSpeedUnit(this.currentSpeedUnit);
		this.updateSpeed(speed, threshold);
	}

	/**
	 * Get the current speed unit
	 */
	getCurrentSpeedUnit(): SpeedUnit {
		return this.currentSpeedUnit;
	}

	/**
	 * Updates the timestamp display
	 */
	updateTimestamp(timestamp: number): void {
		const { timestamp: timestampEl } = this.elements;
		if (!timestampEl) return;

		const date = new Date(timestamp);
		timestampEl.innerHTML = timeFormatter.format(date);
	}

	/**
	 * Updates coordinate displays for both SWEREF 99 and WGS84
	 */
	updateCoordinates(sweref: SwerefCoordinates, lat: number, lon: number): void {
		const { swerefn, swerefe, wgs84n, wgs84e } = this.elements;

		if (sweref.northing === 0 && sweref.easting === 0) {
			console.warn("SWEREF 99 coordinates unavailable for position:", { lat, lon });
			if (swerefn) swerefn.innerHTML = UI_TEXT.NOT_AVAILABLE;
			if (swerefe) swerefe.innerHTML = UI_TEXT.NOT_AVAILABLE;
		} else {
			if (swerefn) swerefn.innerHTML = `N&nbsp;${Math.round(sweref.northing).toString().replace(".", ",")}`;
			if (swerefe) swerefe.innerHTML = `E&nbsp;&nbsp;${Math.round(sweref.easting).toString().replace(".", ",")}`;
		}

		if (wgs84n) wgs84n.innerHTML = `N&nbsp;${lat.toString().replace(".", ",")}&deg;`;
		if (wgs84e) wgs84e.innerHTML = `E&nbsp;${lon.toString().replace(".", ",")}&deg;`;
	}

	/**
	 * Sets loading state (shows/hides spinner)
	 */
	setLoadingState(isLoading: boolean): void {
		const { timestamp } = this.elements;
		if (!timestamp) return;

		if (isLoading) {
			timestamp.classList.add("loading");
		} else {
			timestamp.classList.remove("loading");
		}
	}

	/**
	 * Sets button states for active/stopped positioning
	 */
	setButtonState(state: 'active' | 'stopped', hasPosition?: boolean): void {
		const { posbtn, stopbtn, sharebtn } = this.elements;

		if (state === 'active') {
			posbtn?.setAttribute("disabled", "disabled");
			stopbtn?.removeAttribute("disabled");
			sharebtn?.removeAttribute("disabled");
		} else {
			stopbtn?.setAttribute("disabled", "disabled");
			posbtn?.removeAttribute("disabled");
			// Keep share button enabled if we have received a position
			if (hasPosition) {
				sharebtn?.removeAttribute("disabled");
			} else {
				sharebtn?.setAttribute("disabled", "disabled");
			}
		}
	}

	/**
	 * Resets UI to stopped state
	 */
	resetUI(): void {
		const { speed } = this.elements;
		this.setLoadingState(false);
		this.setButtonState('stopped', false);
		if (speed) {
			speed.innerHTML = `–&nbsp;${this.currentSpeedUnit}`;
			speed.classList.remove("outofrange");
		}
		const { timestamp } = this.elements;
		if (timestamp) {
			timestamp.innerHTML = "--:--:--";
		}
	}

	/**
	 * Update speed display to show current unit preference
	 * Should be called on page load to apply saved preference
	 */
	updateSpeedDisplayUnit(): void {
		const { speed } = this.elements;
		if (speed) {
			// Update the unit suffix while preserving the speed value
			// Match any of: "- m/s", "– m/s", "? m/s" (with nbsp)
			const currentHTML = speed.innerHTML;
			if (currentHTML.includes("&nbsp;m/s")) {
				speed.innerHTML = currentHTML.replace("m/s", this.currentSpeedUnit);
			}
		}
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
		const eTextNormalized = eText.replace(/^E\s{2}/, 'E ');
		return `${nText} ${eTextNormalized} (SWEREF 99 TM)`;
	}

	/**
	 * Checks if positioning UI is active
	 */
	isPositioningUIActive(): boolean {
		const { posbtn, stopbtn } = this.elements;
		return posbtn?.hasAttribute("disabled") === true && stopbtn?.hasAttribute("disabled") === false;
	}

	/**
	 * Checks if UI is in an inconsistent state
	 */
	isUIInconsistent(): boolean {
		const { posbtn, stopbtn } = this.elements;
		return posbtn?.hasAttribute("disabled") === true && stopbtn?.hasAttribute("disabled") === true;
	}
}

const uiHelper = new UIHelper();

// ============================================================================
// GEOLOCATION STATE MANAGEMENT
// ============================================================================

let watchID: number | null = null;
let spinnerTimeout: number | null = null;
let hasReceivedPosition: boolean = false;
let currentSpeed: number | null = null;

/**
 * Clears the spinner timeout if it exists
 * This prevents UI flicker and ensures clean state management
 */
function clearSpinnerTimeout(): void {
	if (spinnerTimeout !== null) {
		clearTimeout(spinnerTimeout);
		spinnerTimeout = null;
	}
}

/**
 * Starts the spinner timeout
 * Shows loading indicator after SPINNER_DELAY_MS if position hasn't been received
 */
function startSpinnerTimeout(): void {
	clearSpinnerTimeout();
	spinnerTimeout = window.setTimeout(() => {
		uiHelper.setLoadingState(true);
		spinnerTimeout = null;
	}, SPINNER_DELAY_MS);
}

/**
 * Clears geolocation watch and resets state
 */
function stopGeolocationWatch(): void {
	if (watchID !== null) {
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
	}
	clearSpinnerTimeout();
	uiHelper.setLoadingState(false);
}

// ============================================================================
// GEOLOCATION HANDLERS
// ============================================================================

/**
 * Position success handler
 * Called when a new position is received from the Geolocation API
 */
function handlePositionSuccess(position: GeolocationPosition): void {
	if (watchID === null) {
		return;
	}
	
	clearSpinnerTimeout();
	uiHelper.setLoadingState(false);
	
	if (!isInSweden(position)) {
		showNotification(UI_TEXT.WARNING_NOT_IN_SWEDEN, NOTIFICATION_DURATION.DEFAULT, UI_TEXT.WARNING_NOT_IN_SWEDEN_TITLE);
	}
	
	uiHelper.updateAccuracy(position.coords.accuracy, ACCURACY_THRESHOLD_METERS);
	currentSpeed = position.coords.speed;
	uiHelper.updateSpeed(currentSpeed, SPEED_THRESHOLD_MS);
	uiHelper.updateTimestamp(position.timestamp);

	const sweref = wgs84_to_sweref99tm(position.coords.latitude, position.coords.longitude);
	uiHelper.updateCoordinates(sweref, position.coords.latitude, position.coords.longitude);
	hasReceivedPosition = true;
	uiHelper.setButtonState('active');
}

/**
 * Position error handler
 * Called when geolocation fails (user denied permission or technical error)
 */
function handlePositionError(): void {
	clearSpinnerTimeout();
	uiHelper.setLoadingState(false);
	hasReceivedPosition = false;
	uiHelper.setButtonState('stopped', false);
	showNotification(UI_TEXT.ERROR_NO_POSITION, NOTIFICATION_DURATION.ERROR, UI_TEXT.ERROR_NO_POSITION_TITLE);
}

/**
 * Position restore error handler
 * Silent error handler for restore attempts - resets UI to stopped state
 */
function handlePositionRestoreError(): void {
	console.log("Positioning restore failed, resetting to stopped state");
	stopGeolocationWatch();
	uiHelper.resetUI();
}

/**
 * Initializes and starts position tracking
 * 
 * @param event - Event that triggered position initialization (click, dblclick, or restore)
 */
function posInit(event: Event): void {
	clearSpinnerTimeout();
	uiHelper.setLoadingState(false);

	// Handle restore events differently - test geolocation availability first
	if (event.type === "restore") {
		if (!("geolocation" in navigator)) {
			handlePositionRestoreError();
			return;
		}
		// Test geolocation with a quick position request before starting watch
		navigator.geolocation.getCurrentPosition(
			() => {
				// Geolocation is available, proceed with watch
				if (watchID === null) {
					watchID = navigator.geolocation.watchPosition(
						handlePositionSuccess, 
						handlePositionRestoreError, 
						GEOLOCATION_OPTIONS
					);
					startSpinnerTimeout();
				}
			},
			handlePositionRestoreError,
			GEOLOCATION_TEST_OPTIONS
		);
	} else {
		// Regular positioning start
		if (watchID === null) {
			watchID = navigator.geolocation.watchPosition(
				handlePositionSuccess, 
				handlePositionError, 
				GEOLOCATION_OPTIONS
			);
			startSpinnerTimeout();
		}
	}
}

// ============================================================================
// PAGE VISIBILITY AND NAVIGATION HANDLERS
// ============================================================================

/**
 * Handle page visibility changes and back navigation to restore positioning state
 */
function handleVisibilityChange(): void {
	// Only restore if page becomes visible and UI indicates positioning should be active
	if (!document.hidden && uiHelper.isUIInconsistent()) {
		// UI state is inconsistent - reset to stopped state
		console.log("Detected inconsistent positioning state after navigation, resetting...");
		stopGeolocationWatch();
		uiHelper.resetUI();
		try {
			if (watchID !== null) {
				navigator.geolocation.clearWatch(watchID);
				watchID = null;
			}
		} catch (e) {}
	} else if (!document.hidden && uiHelper.isPositioningUIActive()) {
		// UI indicates positioning should be active, check if watchID is valid
		if (watchID === null) {
			console.log("Positioning was active but watch was lost, restarting...");
			posInit(new Event("restore"));
		}
	}
}

// ============================================================================
// DETAILS STATE PERSISTENCE
// ============================================================================

/**
 * LocalStorage key for storing details state
 */
const DETAILS_STATE_STORAGE_KEY = 'sweref99-details-state';

/**
 * Maximum number of details elements to track (as per requirements)
 */
const MAX_DETAILS_TO_TRACK = 3;

/**
 * Interface for details state data
 */
interface DetailsState {
	[id: string]: boolean;
}

/**
 * Save the open state of all tracked details elements to localStorage
 * 
 * This function reads the current open state of up to three <details> elements
 * and stores them in localStorage for persistence across page loads.
 */
function saveDetailsState(): void {
	try {
		// Check if localStorage is available
		if (typeof localStorage === 'undefined') {
			return;
		}

		// Find all details elements with IDs
		const detailsElements = document.querySelectorAll('details[id]');
		const state: DetailsState = {};
		
		// Track up to MAX_DETAILS_TO_TRACK elements
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

		// Save to localStorage
		localStorage.setItem(DETAILS_STATE_STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		// Silently fail if localStorage is not available or quota exceeded
		console.warn('Failed to save details state:', error);
	}
}

/**
 * Restore the open state of all tracked details elements from localStorage
 * 
 * This function reads the saved state from localStorage and applies it to
 * the <details> elements on the page. Called on page load.
 */
function restoreDetailsState(): void {
	try {
		// Check if localStorage is available
		if (typeof localStorage === 'undefined') {
			return;
		}

		// Retrieve saved state from localStorage
		const savedStateJson = localStorage.getItem(DETAILS_STATE_STORAGE_KEY);
		if (!savedStateJson) {
			return;
		}

		const savedState: DetailsState = JSON.parse(savedStateJson);

		// Apply saved state to details elements
		Object.keys(savedState).forEach((id) => {
			const element = document.getElementById(id);
			if (element && element.tagName === 'DETAILS') {
				const detailsElement = element as HTMLDetailsElement;
				detailsElement.open = savedState[id];
			}
		});
	} catch (error) {
		// Silently fail if localStorage is not available or data is corrupted
		console.warn('Failed to restore details state:', error);
	}
}

/**
 * Initialize details state persistence
 * 
 * Sets up event listeners on all <details> elements to save their state
 * when they are opened or closed.
 */
function initializeDetailsStatePersistence(): void {
	// Restore state on page load
	restoreDetailsState();

	// Add event listeners to all details elements
	const detailsElements = document.querySelectorAll('details[id]');
	detailsElements.forEach((element) => {
		element.addEventListener('toggle', saveDetailsState);
	});
}

// ============================================================================
// EVENT LISTENERS AND INITIALIZATION
// ============================================================================

/**
 * Initialize all event listeners and check geolocation availability
 */
function initializeEventListeners(): void {
	// Keyboard shortcuts
	document.addEventListener(
		"keydown", 
		(event: KeyboardEvent) => {
			if (event.key === "F1") {
				window.location.href = UI_TEXT.HELP_URL;
			}
		},
		false
	);

	// Position control buttons
	document.addEventListener("dblclick", posInit, false);
	posbtn?.addEventListener("click", () => {
		hasReceivedPosition = false;
		posInit(new Event("click"));
	}, false);
	
	// Stop button
	stopbtn?.addEventListener("click", () => {
		stopGeolocationWatch();
		uiHelper.setButtonState('stopped', hasReceivedPosition);
		if (speed) {
			speed.innerHTML = `–&nbsp;${uiHelper.getCurrentSpeedUnit()}`;
			speed.classList.remove("outofrange");
		}
	});

	// Speed unit cycling
	speed?.addEventListener("click", () => {
		uiHelper.cycleSpeedUnit(currentSpeed, SPEED_THRESHOLD_MS);
	});

	// Share button
	sharebtn?.addEventListener("click", async () => {
		try {
			const shareData = {
				title: "Position",
				text: uiHelper.getShareText()
			};
			await navigator.share(shareData);
		} catch (err: any) {
			console.log("Kunde inte dela: ", err.message);
		}
	});

	// Page visibility changes (including back/forward navigation)
	document.addEventListener("visibilitychange", handleVisibilityChange);
	
	// Pageshow event for back/forward navigation in some browsers
	window.addEventListener("pageshow", (event) => {
		// Only trigger for back/forward navigation (persisted pages)
		if (event.persisted) {
			handleVisibilityChange();
		}
	});

	// ServiceWorker registration for offline functionality
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('/sw.js')
				.then((registration) => {
					console.log('ServiceWorker registrerad:', registration.scope);
				})
				.catch((error) => {
					console.log('ServiceWorker-registrering misslyckades:', error);
				});
		});
	}

	// Check geolocation availability
	if (!("geolocation" in navigator)) {
		showNotification(UI_TEXT.ERROR_NO_POSITION, NOTIFICATION_DURATION.ERROR, UI_TEXT.ERROR_NO_POSITION_TITLE);
	} else {
		posbtn?.removeAttribute("disabled");
	}
}

// Initialize the application
initializeEventListeners();

// Initialize details state persistence
initializeDetailsStatePersistence();

// Update speed display to show saved unit preference
uiHelper.updateSpeedDisplayUnit();
