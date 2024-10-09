document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "F1") {
      document.location = "https://sweref99.nu/om.html";
    }
  },
  false,
);

const uncert = document.querySelector("#uncert");
const swerefn = document.querySelector("#sweref-n");
const swerefe = document.querySelector("#sweref-e");

document.addEventListener(
  "dblclick",
  (event) => {
    function success(position: any) {
			uncert!.innerHTML = "&pm;" + Math.round(position.coords.accuracy) + "&nbsp;m";
			swerefn!.innerHTML = "N&nbsp;" + position.coords.latitude;
			swerefe!.innerHTML = "E&nbsp;" + position.coords.longitude;
    }
  
    function error() {
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

const shareData = {
  title: "Position",
  text: "SWEREF 99 TM: N E"
};

const btn = document.querySelector("#share-btn");
btn!.addEventListener("click", async () => {
  try {
    await navigator.share(shareData);
  } catch (err) {
    console.log("Kunde inte dela.");
  }
});
