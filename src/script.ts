document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "F1") {
      document.location = "https://sweref99.nu/om.html";
    }
  },
  false,
);

const shareData = {
  title: "Position",
  text: "SWEREF 99 TM: N E"
};

const btn = document.querySelector("#share-btn");
btn!.addEventListener("click", async () => {
  try {
    await navigator.share(shareData);
  } catch (err) {
    alert("Kunde inte dela.");
  }
});
