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

declare const Module: any;

// WASM module state
let wgs84_to_sweref99tm: any = null;
let wasmAvailable = false;
let wasmInitialized = false;

// Initialize WASM module when available
function initializeWasm(): boolean {
    if (wasmInitialized && wasmAvailable) {
        return wasmAvailable;
    }
    
    try {
        if (typeof Module !== 'undefined' && Module.cwrap) {
            wgs84_to_sweref99tm = Module.cwrap(
                "wgs84_to_sweref99tm",
                "number",
                ["number", "number"]
            );
            wasmAvailable = true;
            wasmInitialized = true;
            console.log("WASM module initialized successfully");
        } else {
            // Don't mark as initialized if Module isn't ready yet
            wasmAvailable = false;
        }
    } catch (error) {
        console.warn("WASM module not available, SWEREF 99 conversion will be unavailable:", error);
        wasmAvailable = false;
        wasmInitialized = true;
    }
    
    return wasmAvailable;
}

function wgs84_to_sweref99tm_js(lat: number, lon: number) {
    // Try to initialize WASM if not already done
    if (!initializeWasm() || !wgs84_to_sweref99tm) {
        console.warn("SWEREF 99 transformation not available - WASM module failed to initialize");
        return { northing: 0, easting: 0 };
    }
    
    try {
        const ptr = wgs84_to_sweref99tm(lat, lon);
        const north = Module.getValue(ptr, "double");
        const east = Module.getValue(ptr + 8, "double");
        Module._free(ptr);
        
        // Validate the result
        if (isNaN(north) || isNaN(east) || (north === 0 && east === 0)) {
            console.warn(`Invalid coordinate transformation result for lat=${lat}, lon=${lon}:`, { north, east });
        }
        
        return { northing: north, easting: east };
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
			swerefn!.innerHTML = "N&nbsp;" + Math.round(sweref.northing).toString().replace(".", ",") + "&nbsp;m";
			swerefe!.innerHTML = "E&nbsp;" + Math.round(sweref.easting).toString().replace(".", ",") + "&nbsp;m";
		}
		wgs84n!.innerHTML = "N&nbsp;" + position.coords.latitude.toString().replace(".", ",") + "&deg;";
		wgs84e!.innerHTML = "E&nbsp;" + position.coords.longitude.toString().replace(".", ",") + "&deg;";
		posbtn!.setAttribute("disabled", "disabled");
		stopbtn!.removeAttribute("disabled");
		sharebtn!.removeAttribute("disabled");
		sharebtn!.removeAttribute("data-tooltip");
	}

	function error() {
		sharebtn!.setAttribute("disabled", "disabled");
		window.alert(errorMsg);
	}

	const options = {
		enableHighAccuracy: true,
		maximumAge: 30000,
		timeout: 27000,
	};

	if (watchID === null) {
		watchID = navigator.geolocation.watchPosition(success, error, options);
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
