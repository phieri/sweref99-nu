"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener("keydown", (event) => {
    if (event.key === "F1") {
        document.location = "https://sweref99.nu/om.html";
    }
}, false);
function isInSweden(pos) {
    if (pos.coords.latitude < 55 || pos.coords.latitude > 69) {
        return false;
    }
    else if (pos.coords.longitude < 10 || pos.coords.longitude > 24) {
        return false;
    }
    else {
        return true;
    }
}
const errorMsg = "Fel: Ingen position tillgänglig. Kontrollera inställningarna för platstjänster i operativsystem och webbläsare!";
const uncert = document.getElementById("uncert");
const speed = document.getElementById("speed");
const swerefn = document.getElementById("sweref-n");
const swerefe = document.getElementById("sweref-e");
const wgs84n = document.getElementById("wgs84-n");
const wgs84e = document.getElementById("wgs84-e");
const posbtn = document.getElementById("pos-btn");
const sharebtn = document.getElementById("share-btn");
const stopbtn = document.getElementById("stop-btn");
let watchID = null;
function posInit(event) {
    function success(position) {
        if (watchID === null) {
            return;
        }
        if (!isInSweden(position)) {
            window.alert("Varning: SWEREF 99 är bara användbart i Sverige.");
        }
        uncert.innerHTML = "&pm;" + Math.round(position.coords.accuracy) + "&nbsp;m";
        if (position.coords.accuracy > 10) {
            uncert.classList.add("outofrange");
        }
        else {
            uncert.classList.remove("outofrange");
        }
        speed.innerHTML = (position.coords.speed !== null ? Math.round(position.coords.speed) : "–") + "&nbsp;m/s";
        if (position.coords.speed !== null && position.coords.speed > 2) {
            speed.classList.add("outofrange");
        }
        else {
            speed.classList.remove("outofrange");
        }
        wgs84n.innerHTML = "N&nbsp;" + position.coords.latitude.toString().replace(".", ",") + "&deg;";
        wgs84e.innerHTML = "E&nbsp;" + position.coords.longitude.toString().replace(".", ",") + "&deg;";
        posbtn.setAttribute("disabled", "disabled");
        stopbtn.removeAttribute("disabled");
        sharebtn.removeAttribute("disabled");
        sharebtn.removeAttribute("data-tooltip");
    }
    function error() {
        sharebtn.setAttribute("disabled", "disabled");
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
posbtn.addEventListener("click", posInit, false);
if (!("geolocation" in navigator)) {
    window.alert(errorMsg);
}
else {
    posbtn.removeAttribute("disabled");
}
sharebtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shareData = {
            title: "Position",
            text: (swerefn === null || swerefn === void 0 ? void 0 : swerefn.textContent) + " " + (swerefe === null || swerefe === void 0 ? void 0 : swerefe.textContent) + " (SWEREF 99 TM)",
        };
        yield navigator.share(shareData);
    }
    catch (err) {
        console.log("Kunde inte dela: ", err.message);
    }
}));
stopbtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    if (watchID !== null) {
        navigator.geolocation.clearWatch(watchID);
        watchID = null;
    }
    stopbtn.setAttribute("disabled", "disabled");
    posbtn.removeAttribute("disabled");
    speed.innerHTML = "–&nbsp;m/s";
    speed.classList.remove("outofrange");
}));
