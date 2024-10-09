document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "F1") {
      document.location = "https://sweref99.nu/om.html";
    }
  },
  false,
);

function isInSweden(pos: any) {
  if (pos.latitude < 20 || pos.latitude > 65) {
    return false;
  } else if (pos.longitude < 20 || pos.longitude > 65) {
    return false;
  } else {
    return true;
  }
}

const uncert = document.querySelector("#uncert");
const swerefn = document.querySelector("#sweref-n");
const swerefe = document.querySelector("#sweref-e");
const sharebtn = document.querySelector("#share-btn");

document.addEventListener(
  "dblclick",
  (event) => {
    function success(position: any) {
      if (!isInSweden(position)) {
        window.alert("Varning: SWEREF 99 är bara användbart i Sverige.")
      }
			uncert!.innerHTML = "&pm;" + Math.round(position.coords.accuracy) + "&nbsp;m";
			swerefn!.innerHTML = "N&nbsp;" + position.coords.latitude;
			swerefe!.innerHTML = "E&nbsp;" + position.coords.longitude;
      sharebtn!.removeAttribute("disabled");
    }

    function error() {
      sharebtn!.setAttribute("disabled", "disabled");
      window.alert("Fel: ingen position tillgänglig.");
    }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000,
    };
    
    const watchID = navigator.geolocation.watchPosition(success, error, options);
  },
  false,
);

if (!("geolocation" in navigator)) {
  window.alert("Fel: platstjänsten är inte tillgänglig.");
}

const btn = document.querySelector("#share-btn");
btn!.addEventListener("click", async () => {
  try {
    const geo = navigator.geolocation.getCurrentPosition();
    const shareData = {
      title: "Position",
      text: "SWEREF 99 TM: N E",
      url: "geo:"
    };
    await navigator.share(shareData);
  } catch (err) {
    console.log("Kunde inte dela.");
  }
});
