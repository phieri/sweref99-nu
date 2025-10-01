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

// PROJ4JS-based coordinate transformation
function wgs84_to_sweref99tm_js(lat: number, lon: number) {
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
		
		const easting = result[0];
		const northing = result[1];

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

const errorMsg = "Fel: Ingen position tillgänglig. Kontrollera inställningarna för platstjänster i operativsystem och webbläsare!";

const uncert   = document.getElementById("uncert");
const speed    = document.getElementById("speed");
const swerefn  = document.getElementById("sweref-n");
const swerefe  = document.getElementById("sweref-e");
const wgs84n   = document.getElementById("wgs84-n");
const wgs84e   = document.getElementById("wgs84-e");
const posbtn   = document.getElementById("pos-btn");
const sharebtn = document.getElementById("share-btn");
const stopbtn  = document.getElementById("stop-btn");

let watchID: number | null = null;

function posInit(event: Event) {
	function success(position: GeolocationPosition) {
		if (watchID === null) {
			return;
		}
		if (!isInSweden(position)) {
			window.alert("Varning: SWEREF 99 är bara användbart i Sverige.")
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

		const sweref = wgs84_to_sweref99tm_js(position.coords.latitude, position.coords.longitude);

		if (sweref.northing === 0 && sweref.easting === 0) {
			console.warn("SWEREF 99 coordinates unavailable for position:", 
				{ lat: position.coords.latitude, lon: position.coords.longitude });
			swerefn!.innerHTML = "Ej&nbsp;tillgängligt";
			swerefe!.innerHTML = "Ej&nbsp;tillgängligt";
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
		sharebtn!.setAttribute("disabled", "disabled");
		window.alert(errorMsg);
	}

	function restoreError() {
		// Silent error handler for restore attempts - reset UI to stopped state
		console.log("Positioning restore failed, resetting to stopped state");
		stopbtn!.setAttribute("disabled", "disabled");
		posbtn!.removeAttribute("disabled");
		speed!.innerHTML = "–&nbsp;m/s";
		speed!.classList.remove("outofrange");
		if (watchID !== null) {
			navigator.geolocation.clearWatch(watchID);
			watchID = null;
		}
	}

	const options = {
		enableHighAccuracy: true,
		maximumAge: 30000,
		timeout: 27000,
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
				}
			},
			restoreError,
			{ timeout: 5000, maximumAge: 60000 }
		);
	} else {
		// Regular positioning start
		if (watchID === null) {
			watchID = navigator.geolocation.watchPosition(success, error, options);
		}
	}
}

document.addEventListener("dblclick", posInit, false);
posbtn!.addEventListener("click", posInit, false);

if (!("geolocation" in navigator)) {
	window.alert(errorMsg);
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
		stopbtn!.setAttribute("disabled", "disabled");
		posbtn!.removeAttribute("disabled");
		speed!.innerHTML = "–&nbsp;m/s";
		speed!.classList.remove("outofrange");
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
