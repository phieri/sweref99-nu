document.addEventListener(
	"keydown", (event: KeyboardEvent) => {
		if (event.key === "F1") {
			document.location = "https://sweref99.nu/om.html";
		}
	},
	false,
);

function isInSweden(pos: GeolocationPosition): boolean {
	const { latitude, longitude } = pos.coords;
	return latitude >= 55 && latitude <= 69 && longitude >= 10 && longitude <= 24;
}

declare const proj4: any;

// Interfaces för koordinatsystem och transformationer
interface SwerefCoordinates {
	northing: number;
	easting: number;
}

interface Itrf2Etrs89Correction {
	dn: number;
	de: number;
}

/**
 * CoordinateTransformer - hanterar koordinattransformationer mellan WGS84 och SWEREF 99 TM
 * Inkluderar tidskorrigering för ITRF/ETRS89-drift
 */
class CoordinateTransformer {
	private correction: Itrf2Etrs89Correction;
	private proj4Initialized = false;

	constructor() {
		this.correction = this.calculateItrf2Etrs89Correction();
	}

	// Beräkna tidskorrigering för ITRF/ETRS89-drift
	// WGS84 (realiserat via ITRF) och SWEREF 99 (ETRS89 epoch 1999.5) 
	// skiljer sig med tiden pga. kontinentaldrift i Europa
	private calculateItrf2Etrs89Correction(): Itrf2Etrs89Correction {
		// ETRS89 fixerades vid epoch 1989.0
		// SWEREF 99 är en realisering av ETRS89 vid epoch 1999.5
		const etrs89Epoch = 1989.0;
		
		// Beräkna aktuellt år (decimalår)
		const now = new Date();
		const yearStart = new Date(now.getFullYear(), 0, 1);
		const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
		const yearFraction = (now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime());
		const currentEpoch = now.getFullYear() + yearFraction;
		
		// Tid sedan ETRS89 fixerades
		const yearsSinceEtrs89 = currentEpoch - etrs89Epoch;
		
		// Europeiska plattan rör sig ungefär 2.5 cm/år relativt ITRF
		// Riktning: nordost (cirka 25° från norr)
		// Källa: EUREF, Lantmäteriet tekniska rapporter
		const plateVelocityMeterPerYear = 0.025; // 2.5 cm/år
		const azimuthDegrees = 25; // grader från norr, öster är positiv
		
		// Konvertera till nord- och östkomponenter
		const azimuthRad = (azimuthDegrees * Math.PI) / 180;
		const northVelocity = plateVelocityMeterPerYear * Math.cos(azimuthRad);
		const eastVelocity = plateVelocityMeterPerYear * Math.sin(azimuthRad);
		
		// Total förskjutning sedan ETRS89 epoch
		const totalNorthShift = northVelocity * yearsSinceEtrs89;
		const totalEastShift = eastVelocity * yearsSinceEtrs89;
		
		return {
			dn: totalNorthShift,
			de: totalEastShift
		};
	}

	private initializeProj4(): boolean {
		if (this.proj4Initialized) {
			return true;
		}

		if (typeof proj4 === 'undefined') {
			console.warn("SWEREF 99 transformation not available - proj4 library not loaded");
			return false;
		}

		// Define coordinate systems if not already defined
		// WGS84 is built-in as 'EPSG:4326'
		// SWEREF 99 TM (EPSG:3006) definition
		if (!proj4.defs('EPSG:3006')) {
			proj4.defs('EPSG:3006', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
		}

		this.proj4Initialized = true;
		return true;
	}

	wgs84ToSweref99TM(lat: number, lon: number): SwerefCoordinates {
		try {
			if (!this.initializeProj4()) {
				return { northing: 0, easting: 0 };
			}

			// Transform coordinates using proj4
			// Input: [longitude, latitude] in WGS84 (EPSG:4326)
			// Output: [easting, northing] in SWEREF 99 TM (EPSG:3006)
			const result = proj4('EPSG:4326', 'EPSG:3006', [lon, lat]);

			let easting = result[0];
			let northing = result[1];

			// Applicera tidskorrigering för ITRF->ETRS89 drift
			// Detta kompenserar för att WGS84 (ITRF-realisering) och SWEREF 99 (ETRS89)
			// skiljer sig åt och att skillnaden ökar med tiden
			northing += this.correction.dn;
			easting += this.correction.de;

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
}

const coordinateTransformer = new CoordinateTransformer();

// Bakåtkompatibel funktion för befintlig kod
function wgs84_to_sweref99tm(lat: number, lon: number): SwerefCoordinates {
	return coordinateTransformer.wgs84ToSweref99TM(lat, lon);
}

const errorMsg_sv: string = "Fel: Ingen position tillgänglig. Kontrollera inställningarna för platstjänster i operativsystem och webbläsare!";
const na_sv: string = "Ej&nbsp;tillgängligt"

// Position accuracy threshold (meters)
// Smartphone GPS typically achieves 3-5m accuracy in optimal conditions and 10-20m in real-world
// scenarios with signal obstructions. SWEREF 99 transformation accuracy is within 1m.
// A 5m threshold represents typical optimal smartphone GPS accuracy and is appropriate for
// general navigation and coordinate display purposes.
// Sources: Smartphone GNSS research (Link et al., 2025; DXOMark GPS testing)
const ACCURACY_THRESHOLD_METERS: number = 5;

// Speed threshold (m/s) for distinguishing stationary/walking from faster movement
// Typical pedestrian walking speed ranges from 1.1-1.4 m/s (4-5 km/h). GPS positioning
// when stationary can show spurious movement due to signal noise. A threshold of 1.4 m/s
// corresponds to the upper end of normal walking speed and effectively distinguishes
// between pedestrian movement and faster travel (cycling, driving, etc.).
// Sources: Pedestrian speed analysis (MDPI Sustainability, 2024); GPS accuracy studies
const SPEED_THRESHOLD_MS: number = 1.4;

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

/**
 * NotificationManager - hanterar meddelanden via Dialog API
 * Inkluderar auto-close och klick-utanför-stängning
 */
class NotificationManager {
	private dialog: HTMLDialogElement | null;
	private content: HTMLElement | null;
	private header: HTMLElement | null;
	private titleElement: HTMLElement | null;
	private backdropListenerAdded = false;

	constructor(
		dialog: HTMLDialogElement | null,
		content: HTMLElement | null,
		header: HTMLElement | null,
		titleElement: HTMLElement | null
	) {
		this.dialog = dialog;
		this.content = content;
		this.header = header;
		this.titleElement = titleElement;
		this.setupBackdropListener();
	}

	private setupBackdropListener(): void {
		if (!this.dialog || this.backdropListenerAdded) {
			return;
		}

		this.dialog.addEventListener('click', (event) => {
			const rect = this.dialog!.getBoundingClientRect();
			const isInDialog = (
				rect.top <= event.clientY &&
				event.clientY <= rect.top + rect.height &&
				rect.left <= event.clientX &&
				event.clientX <= rect.left + rect.width
			);
			if (!isInDialog) {
				this.dialog!.close();
			}
		});
		this.backdropListenerAdded = true;
	}

	show(message: string, duration: number = 5000, title?: string): void {
		if (!this.dialog || !this.content) {
			window.alert(message);
			return;
		}

		// Stäng eventuellt öppet dialog först
		if (this.dialog.open) {
			this.dialog.close();
		}

		// Sätt rubrik om angiven
		if (title && this.header && this.titleElement) {
			this.titleElement.textContent = title;
			this.header.style.display = '';
		} else if (this.header) {
			this.header.style.display = 'none';
		}

		// Sätt meddelande och visa dialog
		this.content.textContent = message;
		this.dialog.showModal();

		// Dölj automatiskt efter angiven tid
		setTimeout(() => {
			if (this.dialog?.open) {
				this.dialog.close();
			}
		}, duration);
	}
}

const notificationManager = new NotificationManager(
	notificationDialog,
	notificationContent,
	notificationHeader,
	notificationTitle
);

// Bakåtkompatibel funktion för befintlig kod
function showNotification(message: string, duration: number = 5000, title?: string): void {
	notificationManager.show(message, duration, title);
}

// Skapa tidsstämpelformatterare en gång för återanvändning
const timeFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('sv-SE', {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false
});

/**
 * UIHelper - centraliserar all DOM-manipulation och UI-state management
 * Ger enkelt API för att uppdatera alla UI-element
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

	updateTimestamp(timestamp: number): void {
		const { timestamp: timestampEl } = this.elements;
		if (!timestampEl) return;

		const date = new Date(timestamp);
		timestampEl.innerHTML = timeFormatter.format(date);
	}

	updateCoordinates(sweref: SwerefCoordinates, lat: number, lon: number, na_sv: string): void {
		const { swerefn, swerefe, wgs84n, wgs84e } = this.elements;

		if (sweref.northing === 0 && sweref.easting === 0) {
			console.warn("SWEREF 99 coordinates unavailable for position:", { lat, lon });
			if (swerefn) swerefn.innerHTML = na_sv;
			if (swerefe) swerefe.innerHTML = na_sv;
		} else {
			if (swerefn) swerefn.innerHTML = `N&nbsp;${Math.round(sweref.northing).toString().replace(".", ",")}`;
			if (swerefe) swerefe.innerHTML = `E&nbsp;${Math.round(sweref.easting).toString().replace(".", ",")}`;
		}

		if (wgs84n) wgs84n.innerHTML = `N&nbsp;${lat.toString().replace(".", ",")}&deg;`;
		if (wgs84e) wgs84e.innerHTML = `E&nbsp;${lon.toString().replace(".", ",")}&deg;`;
	}

	setLoadingState(isLoading: boolean): void {
		const { timestamp } = this.elements;
		if (!timestamp) return;

		if (isLoading) {
			timestamp.classList.add("loading");
		} else {
			timestamp.classList.remove("loading");
		}
	}

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

	resetUI(): void {
		const { speed, timestamp } = this.elements;
		this.setLoadingState(false);
		this.setButtonState('stopped');
		if (speed) {
			speed.innerHTML = "–&nbsp;m/s";
			speed.classList.remove("outofrange");
		}
		if (timestamp) {
			timestamp.innerHTML = "--:--:--";
		}
	}

	getShareText(): string {
		const { swerefn, swerefe } = this.elements;
		return `${swerefn?.textContent ?? ''} ${swerefe?.textContent ?? ''} (SWEREF 99 TM)`;
	}

	isPositioningUIActive(): boolean {
		const { posbtn, stopbtn } = this.elements;
		return posbtn?.hasAttribute("disabled") === true && stopbtn?.hasAttribute("disabled") === false;
	}

	isUIInconsistent(): boolean {
		const { posbtn, stopbtn } = this.elements;
		return posbtn?.hasAttribute("disabled") === true && stopbtn?.hasAttribute("disabled") === true;
	}
}

const uiHelper = new UIHelper();

/**
 * GeolocationManager - hanterar positionering och state
 * Kapslar in watchID, spinner state och all positioneringslogik
 */
class GeolocationManager {
	private watchID: number | null = null;
	private spinnerTimeout: number | null = null;
	private readonly options: PositionOptions = {
		enableHighAccuracy: true,
		maximumAge: 20000,
		timeout: 28000
	};

	constructor(
		private ui: UIHelper,
		private transformer: CoordinateTransformer,
		private notification: NotificationManager,
		private errorMsg: string,
		private accuracyThreshold: number,
		private speedThreshold: number,
		private naText: string
	) {}

	private clearSpinner(): void {
		if (this.spinnerTimeout !== null) {
			clearTimeout(this.spinnerTimeout);
			this.spinnerTimeout = null;
		}
		this.ui.setLoadingState(false);
	}

	private startSpinner(): void {
		this.spinnerTimeout = window.setTimeout(() => {
			this.ui.setLoadingState(true);
			this.spinnerTimeout = null;
		}, 5000);
	}

	private handleSuccess = (position: GeolocationPosition): void => {
		if (this.watchID === null) {
			return;
		}

		this.clearSpinner();

		if (!isInSweden(position)) {
			this.notification.show("Varning: SWEREF 99 är bara användbart i Sverige.");
		}

		this.ui.updateAccuracy(position.coords.accuracy, this.accuracyThreshold);
		this.ui.updateSpeed(position.coords.speed, this.speedThreshold);
		this.ui.updateTimestamp(position.timestamp);

		const sweref = this.transformer.wgs84ToSweref99TM(
			position.coords.latitude,
			position.coords.longitude
		);
		this.ui.updateCoordinates(sweref, position.coords.latitude, position.coords.longitude, this.naText);
		this.ui.setButtonState('active');
	};

	private handleError = (): void => {
		this.clearSpinner();
		this.ui.setButtonState('stopped');
		this.ui.getShareText(); // Trigger share button disable via state
		this.notification.show(this.errorMsg, 7000);
	};

	private handleRestoreError = (): void => {
		console.log("Positioning restore failed, resetting to stopped state");
		this.clearSpinner();
		this.ui.resetUI();
		if (this.watchID !== null) {
			navigator.geolocation.clearWatch(this.watchID);
			this.watchID = null;
		}
	};

	start(isRestore: boolean = false): void {
		this.clearSpinner();

		if (isRestore) {
			if (!("geolocation" in navigator)) {
				this.handleRestoreError();
				return;
			}

			// Test geolocation with a quick position request before starting watch
			navigator.geolocation.getCurrentPosition(
				() => {
					if (this.watchID === null) {
						this.watchID = navigator.geolocation.watchPosition(
							this.handleSuccess,
							this.handleRestoreError,
							this.options
						);
						this.startSpinner();
					}
				},
				this.handleRestoreError,
				{ timeout: 5000, maximumAge: 60000 }
			);
		} else {
			if (this.watchID === null) {
				this.watchID = navigator.geolocation.watchPosition(
					this.handleSuccess,
					this.handleError,
					this.options
				);
				this.startSpinner();
			}
		}
	}

	stop(): void {
		if (this.watchID !== null) {
			navigator.geolocation.clearWatch(this.watchID);
			this.watchID = null;
		}
		this.clearSpinner();
		this.ui.setButtonState('stopped');
		// Reset speed display
		const speedEl = document.getElementById("speed");
		if (speedEl) {
			speedEl.innerHTML = "–&nbsp;m/s";
			speedEl.classList.remove("outofrange");
		}
	}

	isActive(): boolean {
		return this.watchID !== null;
	}

	handleVisibilityChange(): void {
		if (document.hidden) {
			return;
		}

		if (this.ui.isUIInconsistent()) {
			console.log("Detected inconsistent positioning state after navigation, resetting...");
			this.clearSpinner();
			this.ui.resetUI();
			try {
				if (this.watchID !== null) {
					navigator.geolocation.clearWatch(this.watchID);
					this.watchID = null;
				}
			} catch (e) {
				console.error("Error clearing watch:", e);
			}
		} else if (this.ui.isPositioningUIActive() && this.watchID === null) {
			console.log("Positioning was active but watch was lost, restarting...");
			this.start(true);
		}
	}
}

const geolocationManager = new GeolocationManager(
	uiHelper,
	coordinateTransformer,
	notificationManager,
	errorMsg_sv,
	ACCURACY_THRESHOLD_METERS,
	SPEED_THRESHOLD_MS,
	na_sv
);

// Bakåtkompatibel funktion för event handlers
function posInit(event: Event): void {
	const isRestore = event.type === "restore";
	geolocationManager.start(isRestore);
}

document.addEventListener("dblclick", posInit, false);
posbtn!.addEventListener("click", posInit, false);

if (!("geolocation" in navigator)) {
	showNotification(errorMsg_sv, 7000);
} else {
	posbtn!.removeAttribute("disabled");
}

sharebtn!.addEventListener("click", async () => {
	try {
		const shareData = {
			title: "Position",
			text: uiHelper.getShareText()
		};
		await navigator.share(shareData);
	} catch (err) {
		console.log("Kunde inte dela: ", err instanceof Error ? err.message : String(err));
	}
});

stopbtn!.addEventListener("click", () => {
	geolocationManager.stop();
});

// Handle page visibility changes and back navigation to restore positioning state
function handleVisibilityChange(): void {
	geolocationManager.handleVisibilityChange();
}

// Listen for page visibility changes (including back/forward navigation)
document.addEventListener("visibilitychange", handleVisibilityChange);

// Also listen for pageshow event to handle back/forward navigation in some browsers
window.addEventListener("pageshow", (event) => {
	// Only trigger for back/forward navigation (persisted pages)
	if (event.persisted) {
		handleVisibilityChange();
	}
});

// Registrera Service Worker för offline-funktionalitet
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
