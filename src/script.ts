document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "F1") {
      document.location = "https://sweref99.nu/om.html";
    }
  },
  false,
);

document.addEventListener(
  "dblclick",
  (event) => {
    function success(position) {
      window.alert(position.coords.latitude);
    }
    
    function error() {
      alert("Sorry, no position available.");
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

if ("geolocation" in navigator) {
    window.alert("Geoloc avai");
} else {
    window.alert("No geolo");
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
