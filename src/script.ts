document.addEventListener(
	"keydown", (event: KeyboardEvent) => {
		if (event.key === "F1") {
			document.location = "https://sweref99.nu/om.html";
		}
	},
	false,
);

function isInSweden(pos: GeolocationPosition) {
	if (pos.coords.latitude < 55 || pos.coords.latitude > 69) {
		return false;
	} else if (pos.coords.longitude < 10 || pos.coords.longitude > 24) {
		return false;
	} else {
		return true;
	}
}

declare const proj4: any;

// Beräkna tidskorrigering för ITRF/ETRS89-drift
// WGS84 (realiserat via ITRF) och SWEREF 99 (ETRS89 epoch 1999.5) 
// skiljer sig med tiden pga. kontinentaldrift i Europa
// Denna beräkning görs en gång vid appstart
function calculateItrf2Etrs89Correction(): { dn: number, de: number } {
	// ETRS89 fixerades vid epoch 1989.0
	// SWEREF 99 är en realisering av ETRS89 vid epoch 1999.5
	const etrs89Epoch: number = 1989.0;
	const sweref99Epoch: number = 1999.5;
	
	// Beräkna aktuellt år (decimalår)
	const now = new Date();
	const yearStart = new Date(now.getFullYear(), 0, 1);
	const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
	const yearFraction: number = (now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime());
	const currentEpoch: number = now.getFullYear() + yearFraction;
	
	// Tid sedan ETRS89 fixerades
	const yearsSinceEtrs89: number = currentEpoch - etrs89Epoch;
	
	// Europeiska plattan rör sig ungefär 2.5 cm/år relativt ITRF
	// Riktning: nordost (cirka 25° från norr)
	// Källa: EUREF, Lantmäteriet tekniska rapporter
	const plateVelocityMeterPerYear = 0.025; // 2.5 cm/år
	const azimuthDegrees: number = 25; // grader från norr, öster är positiv
	
	// Konvertera till nord- och östkomponenter
	const azimuthRad: number = (azimuthDegrees * Math.PI) / 180;
	const northVelocity: number = plateVelocityMeterPerYear * Math.cos(azimuthRad);
	const eastVelocity: number = plateVelocityMeterPerYear * Math.sin(azimuthRad);
	
	// Total förskjutning sedan ETRS89 epoch
	const totalNorthShift: number = northVelocity * yearsSinceEtrs89;
	const totalEastShift: number = eastVelocity * yearsSinceEtrs89;
	
	return {
		dn: totalNorthShift,
		de: totalEastShift
	};
}

// Beräkna korrigeringen en gång vid appstart
const itrf2Etrs89Correction = calculateItrf2Etrs89Correction();

// PROJ4JS-based coordinate transformation
function wgs84_to_sweref99tm(lat: number, lon: number) {
	try {
		// Check if proj4 library is available
		if (typeof proj4 === 'undefined') {
			console.warn("SWEREF 99 transformation not available - proj4 library not loaded");
			return { northing: 0, easting: 0 };
		}

		// Define coordinate systems if not already defined
		// WGS84 is built-in as 'EPSG:4326'
		// SWEREF 99 TM (EPSG:3006) definition
		if (!proj4.defs('EPSG:3006')) {
				proj4.defs('EPSG:3006', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
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

const errorMsg_sv = "Fel: Ingen position tillgänglig. Kontrollera inställningarna för platstjänster i operativsystem och webbläsare!";
const na_sv = "Ej&nbsp;tillgängligt"

const uncert    = document.getElementById("uncert");
const speed     = document.getElementById("speed");
const timestamp = document.getElementById("timestamp");
const swerefn   = document.getElementById("sweref-n");
const swerefe   = document.getElementById("sweref-e");
const wgs84n    = document.getElementById("wgs84-n");
const wgs84e    = document.getElementById("wgs84-e");
const posbtn    = document.getElementById("pos-btn");
const sharebtn  = document.getElementById("share-btn");
const stopbtn   = document.getElementById("stop-btn");

// Hämta popover-elementet
const notificationPopover = document.getElementById("notification-popover") as HTMLElement;

// Funktion för att visa meddelanden via Popover API
function showNotification(message: string, duration: number = 5000) {
	if (!notificationPopover) {
		// Fallback om popover-elementet inte finns
		console.warn("Notification popover element not found, using alert fallback");
		window.alert(message);
		return;
	}
	
	// Stäng eventuellt öppet popover först
	if (notificationPopover.matches(':popover-open')) {
		notificationPopover.hidePopover();
	}
	
	// Sätt meddelande och visa popover
	notificationPopover.textContent = message;
	notificationPopover.showPopover();
	
	// Dölj automatiskt efter angiven tid
	setTimeout(() => {
		if (notificationPopover.matches(':popover-open')) {
			notificationPopover.hidePopover();
		}
	}, duration);
}

// Skapa tidsstämpelformatterare en gång för återanvändning
const timeFormatter = new Intl.DateTimeFormat('sv-SE', {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: false
});

let watchID: number | null = null;
let spinnerTimeout: number | null = null;

function posInit(event: Event) {
	// Rensa eventuell befintlig spinner-timer för att undvika flimmer
	if (spinnerTimeout !== null) {
		clearTimeout(spinnerTimeout);
		spinnerTimeout = null;
	}
	timestamp!.classList.remove("loading");
	
	function success(position: GeolocationPosition) {
		if (watchID === null) {
			return;
		}
		
		// Ta bort spinner om den visas
		if (spinnerTimeout !== null) {
			clearTimeout(spinnerTimeout);
			spinnerTimeout = null;
		}
		timestamp!.classList.remove("loading");
		
		if (!isInSweden(position)) {
			showNotification("Varning: SWEREF 99 är bara användbart i Sverige.");
		}
		uncert!.innerHTML = "&pm;" + Math.round(position.coords.accuracy) + "&nbsp;m";
		if (position.coords.accuracy > 10) {
			uncert!.classList.add("outofrange");
		} else {
			uncert!.classList.remove("outofrange");
		}
		speed!.innerHTML = (position.coords.speed !== null ? Math.round(position.coords.speed) : "–") + "&nbsp;m/s";
		if (position.coords.speed !== null && position.coords.speed > 2) {
			speed!.classList.add("outofrange");
		} else {
			speed!.classList.remove("outofrange");
		}
		
		// Formatera och visa tidsstämpel (hh:mm:ss)
		const date = new Date(position.timestamp);
		timestamp!.innerHTML = timeFormatter.format(date);

		const sweref = wgs84_to_sweref99tm(position.coords.latitude, position.coords.longitude);

		if (sweref.northing === 0 && sweref.easting === 0) {
			console.warn("SWEREF 99 coordinates unavailable for position:", 
				{ lat: position.coords.latitude, lon: position.coords.longitude });
			swerefn!.innerHTML = na_sv;
			swerefe!.innerHTML = na_sv;
		} else {
			swerefn!.innerHTML = "N&nbsp;" + Math.round(sweref.northing).toString().replace(".", ",");
			swerefe!.innerHTML = "E&nbsp;" + Math.round(sweref.easting).toString().replace(".", ",");
		}
		wgs84n!.innerHTML = "N&nbsp;" + position.coords.latitude.toString().replace(".", ",") + "&deg;";
		wgs84e!.innerHTML = "E&nbsp;" + position.coords.longitude.toString().replace(".", ",") + "&deg;";
		posbtn!.setAttribute("disabled", "disabled");
		stopbtn!.removeAttribute("disabled");
		sharebtn!.removeAttribute("disabled");
	}

	function error() {
		// Ta bort spinner om den visas
		if (spinnerTimeout !== null) {
			clearTimeout(spinnerTimeout);
			spinnerTimeout = null;
		}
		timestamp!.classList.remove("loading");
		
		sharebtn!.setAttribute("disabled", "disabled");
		showNotification(errorMsg_sv, 7000);
	}

	function restoreError() {
		// Silent error handler for restore attempts - reset UI to stopped state
		console.log("Positioning restore failed, resetting to stopped state");
		
		// Ta bort spinner om den visas
		if (spinnerTimeout !== null) {
			clearTimeout(spinnerTimeout);
			spinnerTimeout = null;
		}
		timestamp!.classList.remove("loading");
		
		stopbtn!.setAttribute("disabled", "disabled");
		posbtn!.removeAttribute("disabled");
		speed!.innerHTML = "–&nbsp;m/s";
		speed!.classList.remove("outofrange");
		timestamp!.innerHTML = "--:--:--";
		if (watchID !== null) {
			navigator.geolocation.clearWatch(watchID);
			watchID = null;
		}
	}

	const options = {
		enableHighAccuracy: true,
		maximumAge: 20000,
		timeout: 28000,
	};

	// Handle restore events differently - test geolocation availability first
	if (event.type === "restore") {
		if (!("geolocation" in navigator)) {
			restoreError();
			return;
		}
		// Test geolocation with a quick position request before starting watch
		navigator.geolocation.getCurrentPosition(
			() => {
				// Geolocation is available, proceed with watch
				if (watchID === null) {
					watchID = navigator.geolocation.watchPosition(success, restoreError, options);
					
					// Starta timer för spinner efter 5 sekunder (även för restore)
					spinnerTimeout = window.setTimeout(() => {
						timestamp!.classList.add("loading");
						spinnerTimeout = null;
					}, 5000);
				}
			},
			restoreError,
			{ timeout: 5000, maximumAge: 60000 }
		);
	} else {
		// Regular positioning start
		if (watchID === null) {
			watchID = navigator.geolocation.watchPosition(success, error, options);
			
			// Starta timer för spinner efter 5 sekunder
			spinnerTimeout = window.setTimeout(() => {
				timestamp!.classList.add("loading");
				spinnerTimeout = null;
			}, 5000);
		}
	}
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
			text: swerefn?.textContent + " " + swerefe?.textContent + " (SWEREF 99 TM)",
		};
		await navigator.share(shareData);
	} catch (err: any) {
		console.log("Kunde inte dela: ", err.message);
	}
});

stopbtn!.addEventListener("click", async () => {
	if (watchID !== null) {
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
	}
	
	// Ta bort spinner om den visas
	if (spinnerTimeout !== null) {
		clearTimeout(spinnerTimeout);
		spinnerTimeout = null;
	}
	timestamp!.classList.remove("loading");
	
	stopbtn!.setAttribute("disabled", "disabled");
	posbtn!.removeAttribute("disabled");
	speed!.innerHTML = "–&nbsp;m/s";
	speed!.classList.remove("outofrange");
});

// Handle page visibility changes and back navigation to restore positioning state
function handleVisibilityChange() {
	// Only restore if page becomes visible and UI indicates positioning should be active
	if (!document.hidden && posbtn!.hasAttribute("disabled") && stopbtn!.hasAttribute("disabled")) {
		// UI state is inconsistent - reset to stopped state
		console.log("Detected inconsistent positioning state after navigation, resetting...");
		
		// Ta bort spinner om den visas
		if (spinnerTimeout !== null) {
			clearTimeout(spinnerTimeout);
			spinnerTimeout = null;
		}
		timestamp!.classList.remove("loading");
		
		stopbtn!.setAttribute("disabled", "disabled");
		posbtn!.removeAttribute("disabled");
		speed!.innerHTML = "–&nbsp;m/s";
		speed!.classList.remove("outofrange");
		timestamp!.innerHTML = "--:--:--";
		try {
			if (watchID !== null) {
				navigator.geolocation.clearWatch(watchID);
				watchID = null;
			}
		} catch (e) {}
	} else if (!document.hidden && posbtn!.hasAttribute("disabled") && !stopbtn!.hasAttribute("disabled")) {
		// UI indicates positioning should be active, check if watchID is valid
		if (watchID === null) {
			console.log("Positioning was active but watch was lost, restarting...");
			posInit(new Event("restore"));
		}
	}
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
