import L from "leaflet";
import io, { Socket } from "socket.io-client";

let map, socket;
const API = 'http://localhost:3001';

let userPosition;

function setUserPosition(latLng) {
  userPosition = latLng
  console.log(`user position set to: ${userPosition[0]}, ${userPosition[1]}`)
  gpsListners.forEach((listener) => listener(userPosition))
}

function getUserPosition() {
  console.log(`user position served: ${userPosition[0]}, ${userPosition[1]}`)
  return userPosition;
}

function buildingClick(id) {
  console.log("Building clicked:", id);
  if (buildingClickListner.length === 0) {
    console.warn("No building click listeners registered.");
    return
  }
  buildingClickListner.forEach(fn => fn(id));
}

window.buildingClick = buildingClick;

function initWebSocket() {
  socket = io(API);
  socket.on('connection')
}

function initMap(map_div) {
  const southWest = L.latLng(7.252000, 80.590249);
  const northEast = L.latLng(7.255500, 80.593809);
  const bounds = L.latLngBounds(southWest, northEast);

  map = L.map(map_div, {
    maxZoom: 22,
    minZoom: 18,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
  }).setView([7.253750, 80.592028], 19);

  // Create custom panes
  map.createPane('routePane');
  map.getPane('routePane').style.zIndex = 650;

  // Load SVG overlay
  fetch(`${API}/map`)
    .then(res => res.text())
    .then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgElement = svgDoc.documentElement;
      L.svgOverlay(svgElement, bounds).addTo(map);      
    
    })
    .catch(err => console.error('Error loading SVG:', err));

  map.fitBounds(bounds);

  initWebSocket();
}

const buildings = {
  "b29": 35,
  "b10": 29,
  "b16": 81,
  "b31": 61,
  "b15": 10,
  "b14": 8,
  "b6": 15,
  "b13": 20,
  "b7": 57,
  "b12": 22,
  "b33": 87,
  "b32": 75,
  "b11": 88,
  "b18": 68,
  "b18A": 64,
  "b20":92,
  "b21": 56,
  "b28": 27,
  "b22": 25,
  "b30": 30,
  "b23": 50,
  "b24": 48,
  "b4": 50,
  "b2": 44,
  "b1": 40,
  "b34": 71,


};

function buildingToNode(id) {
  return buildings[id];
}


function drawRoute(result) {

  console.log(result)

  map.getPane('routePane').querySelectorAll('path, circle, polygon').forEach(el => el.remove());

  if (result) {

    L.circleMarker(result.snappedAt, { radius: 8, color: 'orange', pane: 'routePane' }).addTo(map).bindTooltip('Snapped');
    L.polyline(result.routeCoords, { color: 'red', weight: 5, pane: 'routePane' }).addTo(map);
    L.circleMarker(result.routeCoords.at(-1), { radius: 7, color: 'red', pane: 'routePane' }).addTo(map).bindTooltip('end');
    map.fitBounds(result.routeCoords);
  }

  setTimeout(() => {
    map.invalidateSize(); 
  }, 50);

}

let userMarker = null;
function drawMarker(latLng) {
  if(userMarker){
    userMarker.remove();
    userMarker = null;
  }
  if(latLng){
    const svgIcon = L.divIcon({
      html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 18 32">
          <path fill="#264f6b" d="M15.85,14.46,8.9,23.14,2,14.46a8.9,8.9,0,1,1,13.9,0Z"/>
          <circle fill="#faf9f4" cx="8.9" cy="8.9" r="3.75"/>
        </svg>
      `,
      className: "custom-svg-marker",        // prevents Leaflet default styles
      iconSize: [32, 32],   // fixed size (doesn't scale with zoom)
      iconAnchor: [16, 32], // bottom center = marker tip
    });
    
    // Add marker
    userMarker = L.marker(latLng, { icon: svgIcon }).addTo(map);
    
  }
}

function setBuildingAccent(buildingId ,accent) {
  let cls = "";
  switch(accent) {
    case "unassigned":
      cls = "st1";
      break;
    case "assigned":
      cls = "st2";
      break;
    case "clicked":
      cls = "st0";
      break;
    default:
      console.warn(`Unknown accent type: ${accent}`);
      return;
  }
  const building = document.querySelector(`#${buildingId}`);
if (building) {
  building.classList.remove("st1", "st2", "st0"); // remove previous accent classes
  building.classList.add(cls);
} else {
  console.warn("Building not found:", buildingId);
}

}



let buildingClickListner = [];

// Add a listener and return a function to remove it
function addBuildingClickListner(listener) {
  buildingClickListner.push(listener);
  console.log("Added building click listener. Total:", buildingClickListner.length);

  // Return an "unsubscribe" function
  return () => {
    removeBuildingClickListner(listener);
  };
}

function removeBuildingClickListner(listener) {
  const index = buildingClickListner.indexOf(listener);
  if (index !== -1) {
    buildingClickListner.splice(index, 1);
  }
}

let gpsListners = [];
function addGpsListner(listener) {
  gpsListners.push(listener);
  return () => {
    removeGpsListner(listener);
  };
}

function removeGpsListner(listener) {
  const index = buildingClickListner.indexOf(listener);
  if (index !== -1) {
    buildingClickListner.splice(index, 1);
  }
}

let watchId;
function startGPS() {
  if (navigator.geolocation) {
    // Watch position continuously
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log(`Updated location: ${lat}, ${lng}`);
        setUserPosition([lat, lng]); // update state -> rerender
      },
      (error) => {
        console.error(error);
        // fallback
        setUserPosition([7.252310, 80.592530]);
      },
      {
        enableHighAccuracy: true,  // better accuracy
        maximumAge: 0,             // don’t use cached
        timeout: 5000              // fail after 5s
      }
    );

  }
}

function sendMessage(type, data) {
  socket.emit(type, data);
}

function addMessageListner(type, listner) {
  socket.on(type, listner);
  return () => {
    socket.off(type, listner); // cleanup on unmount
    console.log(`Removed message listener for type: ${type}`);
  };
}

function stopGps() {
  navigator.geolocation.clearWatch(watchId);
  console.log("GPS tracking stopped.");
}

export {
  map, 
  initMap, 
  setUserPosition, 
  getUserPosition, 
  buildingToNode, 
  drawRoute, 
  addBuildingClickListner, 
  addGpsListner, 
  startGPS, 
  stopGps, 
  drawMarker, 
  addMessageListner, 
  sendMessage,
  setBuildingAccent
};





