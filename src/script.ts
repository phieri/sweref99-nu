document.addEventListener(
  "keydown", (event: KeyboardEvent) => {
    if (event.key === "F1") {
      document.location = "https://sweref99.nu/om.html";
    }
  },
  false,
);

function isInSweden(pos: {latitude: number; longitude: number}) {
  if (pos.latitude < 55 || pos.latitude > 69) {
    return false;
  } else if (pos.longitude < 10 || pos.longitude > 24) {
    return false;
  } else {
    return true;
  }
}

const errorMsg = "Fel: Ingen position tillgänglig. Kontrollera inställningarna för platstjänster i operativsystem och webbläsare!";

const uncert   = document.getElementById("uncert");
const speed    = document.getElementById("speed");
const swerefn  = document.getElementById("sweref-n");
const swerefe  = document.getElementById("sweref-e");
const posbtn   = document.getElementById("pos-btn");
const sharebtn = document.getElementById("share-btn");
const stopbtn  = document.getElementById("stop-btn");

var watchID: any;

function posHandler(event: any) {
	function success(position: any) {
		if (!isInSweden(position)) {
			window.alert("Varning: SWEREF 99 är bara användbart i Sverige.")
		}
		uncert!.innerHTML = "&pm;" + Math.round(position.coords.accuracy) + "&nbsp;m";
		if (position.coords.accuracy > 10) {
			uncert!.setAttribute("style", "color: red");
		} else {
			uncert!.removeAttribute("style");
		}
    speed!.innerHTML = Math.round(position.coords.speed) + "&nbsp;m/s";
		if (position.coords.speed > 2) {
			speed!.setAttribute("style", "color: red");
		} else {
			speed!.removeAttribute("style");
		}
		swerefn!.innerHTML = "N&nbsp;" + position.coords.latitude;
		swerefe!.innerHTML = "E&nbsp;" + position.coords.longitude;
		stopbtn!.removeAttribute("disabled");
		sharebtn!.removeAttribute("disabled");
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

	watchID = navigator.geolocation.watchPosition(success, error, options);
}

document.addEventListener(
	"dblclick", posHandler, false,
);

if (!("geolocation" in navigator)) {
	window.alert(errorMsg);
} else {
	posbtn!.removeAttribute("disabled");
}

sharebtn!.addEventListener("click", async () => {
  try {
    const shareData = {
      title: "Position",
      text: swerefn?.textContent + " " + swerefe?.textContent + " (SWEREF 99 TM)"
    };
    await navigator.share(shareData);
  } catch (err) {
    console.log("Kunde inte dela.");
  }
});

stopbtn!.addEventListener("click", async () => {
	navigator.geolocation.clearWatch(watchID);
});
