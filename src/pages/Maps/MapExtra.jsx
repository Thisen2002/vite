import { use, useEffect, useState } from "react";
import MapComponent from "./Map";
import { 
  addBuildingClickListner, 
  addGpsListner, 
  addMessageListner, 
  sendMessage,
  startGPS,
  buildingToNode,
  drawRoute,
  stopGps 
} from "./map_module";

export default function MapExtra() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [navStatus, setNavStatus] = useState("");
  const [bookmarkStatus, setBookmarkStatus] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Engineering themed dummy building data (extend as needed)
  const engineeringBuildings = {
    b12: {
      department: "Mechanical Engineering",
      description: "Thermodynamics labs, CAD/CAM center, and machine shop.",
      labs: ["Heat Transfer Lab", "Robotics Bay"],
      floors: 4,
      hours: "8:00–18:00",
      contact: "mech-office@univ.edu"
    },
    b28: {
      department: "Electrical & Electronic Engineering",
      description: "Circuits, power systems and embedded systems facilities.",
      labs: ["Power Electronics Lab", "Embedded Systems Studio"],
      floors: 5,
      hours: "8:00–19:00",
      contact: "eee-office@univ.edu"
    },
    b34: {
      department: "Computer Engineering",
      description: "High‑performance computing cluster and AI research hub.",
      labs: ["AI Lab", "Networks & Systems Lab"],
      floors: 6,
      hours: "8:00–20:00",
      contact: "ce-office@univ.edu"
    },
    b07: {
      department: "Civil Engineering",
      description: "Structural testing rigs and materials characterization.",
      labs: ["Materials Lab", "Geotechnical Lab"],
      floors: 3,
      hours: "8:30–17:30",
      contact: "civil-office@univ.edu"
    },
    b19: {
      department: "Chemical & Process Engineering",
      description: "Unit operations pilot plant and process control center.",
      labs: ["Process Control Lab", "Reaction Engineering Lab"],
      floors: 5,
      hours: "8:00–18:00",
      contact: "chem-office@univ.edu"
    }
  };

  const getBuildingInfo = (buildingId) => {
    const key = String(buildingId).toLowerCase();
    const info = engineeringBuildings[key] || {};
    // Fallback generator when id not in map
    const fallbackDepartments = [
      "Software Engineering",
      "Industrial Engineering",
      "Biomedical Engineering",
      "Mechatronics Engineering"
    ];
    const pick = fallbackDepartments[Math.abs(hashCode(key)) % fallbackDepartments.length];
    return {
      id: buildingId,
      name: `Building ${buildingId}`,
      department: info.department || pick,
      description: info.description || "Specialized teaching spaces and research labs.",
      labs: info.labs || ["Innovation Lab", "Prototyping Studio"],
      floors: info.floors || 4,
      hours: info.hours || "8:00–18:00",
      contact: info.contact || `${pick.split(" ")[0].toLowerCase()}-office@univ.edu`
    };
  };

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return h;
  }

  // Cookie helpers for bookmark persistence
  const COOKIE_KEY = "iem_bookmarks";
  const getCookie = (name) => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };
  const setCookie = (name, value, days = 365) => {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  };
  const readBookmarks = () => {
    try {
      const raw = getCookie(COOKIE_KEY);
      if (!raw) return [];
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return [];
    }
  };
  const writeBookmarks = (bookmarks) => {
    try {
      const serialized = encodeURIComponent(JSON.stringify(bookmarks));
      setCookie(COOKIE_KEY, serialized);
    } catch {
      // ignore write errors
    }
  };
  const isBookmarked = (id) => {
    const list = readBookmarks();
    return list.some((b) => String(b.id) === String(id));
  };
  const removeBookmarkLocal = (id) => {
    const list = readBookmarks();
    const next = list.filter((b) => String(b.id) !== String(id));
    writeBookmarks(next);
  };

  useEffect(() => {
    // Listen for building clicks from the map module
    const unsubscribe = addBuildingClickListner((buildingId) => {
      setSelectedBuilding(getBuildingInfo(buildingId));
      setIsSheetOpen(true);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  let unsubscribeGps = () => {};
    
  let unsubscribeRouteListner = () => {};
  
  useEffect(() => {
    
    if (isNavigating) {
      console.log("Navigation started");
      unsubscribeGps = addGpsListner((latLng) => {
        if (isNavigating) {
          if (selectedBuilding?.id) {
            let c = buildingToNode(selectedBuilding?.id) 
            // if (c) {
            //   sendMessage('position-update', {coords:latLng, node: c})
            // }
            sendMessage('position-update', {coords:latLng, node: c})
          }
          
        }
        
      })
  
      unsubscribeRouteListner = addMessageListner('route-update', (r) => drawRoute(r));
  
      startGPS();
    } else {
      stopGps();
      unsubscribeRouteListner();
      unsubscribeGps();
      console.log("Navigation stopped");
    }

    
}, [isNavigating, selectedBuilding]);

  // When selected building changes, reflect bookmark status from cookie
  useEffect(() => {
    // no automatic bookmark status on selection
  }, [selectedBuilding]);

  useEffect(() => {
    const updateMapViewportSize = () => {
      const el = document.getElementById('map');
      if (!el) return;
      const isMobile = window.innerWidth <= 640;
      el.style.height = isMobile ? '78vh' : '860px';
      el.style.width = '100%';
    };
    updateMapViewportSize();
    window.addEventListener('resize', updateMapViewportSize);
    return () => window.removeEventListener('resize', updateMapViewportSize);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .map-legend{display:none !important;}
        .dashboard-filter-card{display:none !important;}
        /* Default desktop map viewport height */
        #map{height:860px !important;}
        @media (max-width: 640px){
          .map-card{margin-top:0 !important;}
          .map-viewport{margin-top:0 !important; padding-top:0 !important;}
          .map-header{margin-bottom:0 !important; padding-bottom:0 !important; gap:0 !important;}
          .dashboard-search-center{margin-bottom:0 !important;}
          .map-card{padding-top:0 !important;}
          .map-search{margin-bottom:0 !important;}
          .map-layout{margin-top:0 !important;}
          .map-main{margin-top:0 !important;}
          .map-page{padding-top:0 !important;}
          /* pull map up just a bit if any residual gap remains */
          .map-card{margin-top:-8px !important;}
          /* Tall mobile map viewport */
          #map{height:78vh !important;}
        }
      `}</style>
      <MapComponent />

      {/* Floating "Navigating" button - appears only after pressing Navigate */}
      {isNavigating && (
        <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9998 }}>
          <button
            type="button"
            aria-label="Cancel navigation"
            style={{
              background: "linear-gradient(90deg, #2563eb 0%, #4338CA 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 9999,
              padding: "12px 18px",
              fontWeight: 700,
              boxShadow:
                "0 10px 15px -3px rgba(67,56,202,0.25), 0 4px 6px -2px rgba(37,99,235,0.2)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 16
            }}
          >
            <span style={{ opacity: 0.95 }}>Navigating</span>
            <span
              aria-hidden="true"
              onClick={(e) => { e.stopPropagation(); setIsNavigating(false); }}
              style={{
                fontWeight: 800,
                marginLeft: 8,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </span>
          </button>
        </div>
      )}

      {isSheetOpen && (
        <div role="dialog" aria-modal="true" aria-label="Building information" className="iem-bottom-sheet" style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: "#ffffff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
          padding: "16px 16px calc(20px + env(safe-area-inset-bottom, 0px)) 16px",
          maxHeight: "50vh",
          overflow: "auto",
          transform: isClosing ? "translateY(100%)" : "translateY(0)",
          transition: "transform 300ms ease"
        }}>
          <style>{`
            .iem-bottom-sheet .iem-title { font-weight: 700; font-size: 18px; color: #1f2937; }
            .iem-bottom-sheet .iem-actions { display: flex; gap: 8px; margin-top: 8px; }
            .iem-bottom-sheet .iem-btn { border-radius: 10px; padding: 10px 14px; font-weight: 600; cursor: pointer; }
            .iem-bottom-sheet .iem-btn-gradient {
              background: linear-gradient(90deg, #2563eb 0%, #4338CA 100%);
              color: #fff;
              border: none;
              border-radius: 9999px;
              padding: 12px 18px;
              box-shadow: 0 10px 15px -3px rgba(67,56,202,0.25), 0 4px 6px -2px rgba(37,99,235,0.2);
              transition: transform 300ms ease-in-out, background 300ms ease-in-out, box-shadow 300ms ease-in-out;
            }
            .iem-bottom-sheet .iem-btn-gradient:hover {
              transform: scale(1.05);
              background: linear-gradient(90deg, #4338CA 0%, #2563eb 100%);
              box-shadow: 0 12px 20px -3px rgba(67,56,202,0.35), 0 6px 10px -2px rgba(37,99,235,0.25);
            }
            .iem-bottom-sheet .iem-meta { color: #374151; font-size: 14px; }
            @media (max-width: 640px) {
              .iem-bottom-sheet { max-height: 65vh !important; padding: 12px 12px calc(16px + env(safe-area-inset-bottom, 0px)) 12px !important; }
              .iem-bottom-sheet .iem-title { font-size: 16px; }
              .iem-bottom-sheet .iem-actions { flex-direction: row; }
              .iem-bottom-sheet .iem-btn { width: 100%; }
            }
          `}</style>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 4,
                background: "#e5e7eb",
                borderRadius: 9999,
                margin: "0 auto 8px auto"
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="iem-title">{selectedBuilding?.name || "Selected Building"}</div>
            <button
              onClick={() => setIsSheetOpen(false)}
              aria-label="Close"
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                color: "#6b7280"
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginTop: 10 }} className="iem-meta">
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: "#2563eb" }}>ID:</strong>
              <span style={{ marginLeft: 6 }}>{selectedBuilding?.id}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "#111827", fontWeight: 600, marginBottom: 6 }}>Department</div>
              <div style={{ color: "#374151" }}>{selectedBuilding?.department}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "#111827", fontWeight: 600, marginBottom: 6 }}>Description</div>
              <div style={{ color: "#374151" }}>{selectedBuilding?.description}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "#111827", fontWeight: 600, marginBottom: 6 }}>Labs</div>
              <div style={{ color: "#374151" }}>
                {(selectedBuilding?.labs || []).join(", ")}
              </div>
            </div>
            <div style={{ marginBottom: 8, display: "flex", gap: 12, color: "#374151" }}>
              <div><strong style={{ color: "#2563eb" }}>Floors:</strong> {selectedBuilding?.floors}</div>
              <div><strong style={{ color: "#2563eb" }}>Hours:</strong> {selectedBuilding?.hours}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: "#2563eb" }}>Contact:</strong>
              <span style={{ marginLeft: 6 }}>{selectedBuilding?.contact}</span>
            </div>
            {navStatus && (
              <div style={{ marginTop: 6, color: "#059669", fontSize: 13 }}>{navStatus}</div>
            )}
            {/* Bookmark status message removed per request */}
            <div className="iem-actions">
              {selectedBuilding && isBookmarked(selectedBuilding.id) ? (
                <button
                  type="button"
                  className="iem-btn iem-btn-gradient"
                  onClick={() => {
                    if (!selectedBuilding) return;
                    const id = selectedBuilding.id;
                    // Remove from cookie
                    removeBookmarkLocal(id);
                    // Notify dashboard if available
                    if (typeof window !== "undefined" && typeof window.removeBookmark === "function") {
                      try { window.removeBookmark(id); } catch {}
                    }
                    setBookmarkStatus("Removed from bookmarks");
                    setTimeout(() => setBookmarkStatus(""), 2000);
                    setIsClosing(true);
                    setTimeout(() => {
                      setIsSheetOpen(false);
                      setIsClosing(false);
                    }, 300);
                  }}
                  aria-label="Unbookmark"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V21l-6-3.5L6 21V3.5Z" stroke="#ffffff" strokeWidth="2" fill="none"/>
                      <path d="M6 6 L18 18" stroke="#ffffff" strokeWidth="2"/>
                    </svg>
                    <span>Unbookmark</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="iem-btn iem-btn-gradient"
                  onClick={() => {
                    if (!selectedBuilding) return;
                    const payload = { id: selectedBuilding.id, name: selectedBuilding.name };
                    const current = readBookmarks();
                    const exists = current.some((b) => String(b.id) === String(payload.id));
                    if (!exists) {
                      current.push(payload);
                      writeBookmarks(current);
                    }
                    if (typeof window !== "undefined" && typeof window.addBookmark === "function") {
                      try { window.addBookmark(payload); } catch {}
                    }
                    // no status message
                    setIsClosing(true);
                    setTimeout(() => {
                      setIsSheetOpen(false);
                      setIsClosing(false);
                    }, 300);
                  }}
                  aria-label="Bookmark"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V21l-6-3.5L6 21V3.5Z" stroke="#ffffff" strokeWidth="2" fill="none"/>
                    </svg>
                    <span>Bookmark</span>
                  </span>
                </button>
              )}
              <button
                type="button"
                className="iem-btn iem-btn-gradient"
                onClick={() => {
                  setNavStatus("Starting navigation...");
                  setTimeout(() => setNavStatus(""), 2000);
                  setIsNavigating(true);
                  setIsClosing(true);
                  setTimeout(() => {
                    setIsSheetOpen(false);
                    setIsClosing(false);
                  }, 300);
                  console.log("Navigate to", selectedBuilding?.id);
                }}
                aria-label="Navigate"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" stroke="#ffffff" strokeWidth="2"/>
                    <path d="M9 15l6-3-3-6-3 9Z" fill="#ffffff"/>
                  </svg>
                  <span>Navigate</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}