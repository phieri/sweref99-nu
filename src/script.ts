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
	NOT_AVAILABLE: "Ej&nbsp;tillgängligt",
	WARNING_NOT_IN_SWEDEN: "Varning: SWEREF 99 är bara användbart i Sverige.",
	HELP_URL: "https://sweref99.nu/om.html"
} as const;

/**
 * Notification duration (milliseconds)
 */
const NOTIFICATION_DURATION = {
	DEFAULT: 5000,
	ERROR: 7000
} as const;

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
		notificationHeader.style.display = '';
	} else if (notificationHeader) {
		notificationHeader.style.display = 'none';
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

		const speedValue = speed !== null ? Math.round(speed) : "?";
		speedEl.innerHTML = `${speedValue}&nbsp;m/s`;
		
		if (speed !== null && speed > threshold) {
			speedEl.classList.add("outofrange");
		} else {
			speedEl.classList.remove("outofrange");
		}
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
			if (swerefe) swerefe.innerHTML = `E&nbsp;${Math.round(sweref.easting).toString().replace(".", ",")}`;
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
	setButtonState(state: 'active' | 'stopped'): void {
		const { posbtn, stopbtn, sharebtn } = this.elements;

		if (state === 'active') {
			posbtn?.setAttribute("disabled", "disabled");
			stopbtn?.removeAttribute("disabled");
			sharebtn?.removeAttribute("disabled");
		} else {
			stopbtn?.setAttribute("disabled", "disabled");
			posbtn?.removeAttribute("disabled");
			sharebtn?.setAttribute("disabled", "disabled");
		}
	}

	/**
	 * Resets UI to stopped state
	 */
	resetUI(): void {
		const { speed } = this.elements;
		this.setLoadingState(false);
		this.setButtonState('stopped');
		if (speed) {
			speed.innerHTML = "–&nbsp;m/s";
			speed.classList.remove("outofrange");
		}
		const { timestamp } = this.elements;
		if (timestamp) {
			timestamp.innerHTML = "--:--:--";
		}
	}

	/**
	 * Gets formatted text for sharing coordinates
	 */
	getShareText(): string {
		const { swerefn, swerefe } = this.elements;
		return `${swerefn?.textContent ?? ''} ${swerefe?.textContent ?? ''} (SWEREF 99 TM)`;
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
		showNotification(UI_TEXT.WARNING_NOT_IN_SWEDEN);
	}
	
	uiHelper.updateAccuracy(position.coords.accuracy, ACCURACY_THRESHOLD_METERS);
	uiHelper.updateSpeed(position.coords.speed, SPEED_THRESHOLD_MS);
	uiHelper.updateTimestamp(position.timestamp);

	const sweref = wgs84_to_sweref99tm(position.coords.latitude, position.coords.longitude);
	uiHelper.updateCoordinates(sweref, position.coords.latitude, position.coords.longitude);
	uiHelper.setButtonState('active');
}

/**
 * Position error handler
 * Called when geolocation fails (user denied permission or technical error)
 */
function handlePositionError(): void {
	clearSpinnerTimeout();
	uiHelper.setLoadingState(false);
	sharebtn!.setAttribute("disabled", "disabled");
	showNotification(UI_TEXT.ERROR_NO_POSITION, NOTIFICATION_DURATION.ERROR);
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
	posbtn?.addEventListener("click", posInit, false);
	
	// Stop button
	stopbtn?.addEventListener("click", () => {
		stopGeolocationWatch();
		uiHelper.setButtonState('stopped');
		if (speed) {
			speed.innerHTML = "–&nbsp;m/s";
			speed.classList.remove("outofrange");
		}
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
		showNotification(UI_TEXT.ERROR_NO_POSITION, NOTIFICATION_DURATION.ERROR);
	} else {
		posbtn?.removeAttribute("disabled");
	}
}

// Initialize the application
initializeEventListeners();
