import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import './Map.css';

import {
  map, 
  initMap, 
  buildingToNode, 
  drawRoute, 
  addBuildingClickListner, 
  getUserPosition, 
  startGPS, 
  addGpsListner, 
  setUserPosition, 
  addMessageListner, 
  sendMessage, 

  stopGps, 
  setBuildingAccent

} from "./map_module";  

function MapComponent() {
  const mapRef = useRef(null);


  const building_clicked = useRef(null);
  const is_navigation_enabled = useRef(true);


  useEffect(() => {
    if (mapRef.current) return; // prevent re-init

    // Initialize the map
    initMap('map');
    mapRef.current = map

    // let unsubscribeGps = addGpsListner((latLng) => {
    //   if (is_navigation_enabled) {
    //     if (building_clicked.current) {

    //       let c = buildingToNode(building_clicked.current)
    //       // if (c) {
    //       //   sendMessage('position-update', {coords:latLng, node: c})
    //       // }
    //       sendMessage('position-update', {coords:latLng, node: c})
    //     }
        

    //   }
      
    // })

    // addMessageListner('route-update', (r) => drawRoute(r));

    // startGPS();

    // setInterval(() => {
    //   const p = getUserPosition();
    //   setUserPosition([p[0]+0.00001, p[1]+0.00001]);
    // }, 1000);

    // let unsubscrbeBuildingListner = addBuildingClickListner((buildingId) => {
    //   console.log("Building clicked:", buildingId);
    //   //getRouteToBuilding(getUserPosition(), buildingId)
    //   // .then(r => drawRoute(r));
    //   building_clicked.current = buildingId;

    //   // setBuildingAccent(buildingId, "unassigned");
    // });

    // return () => {

    // }

  }, []);
  const mapStyle = { height: "740px", width: "640px" };

  return <div id="map" style={mapStyle}></div>;
 
}

export default MapComponent;
