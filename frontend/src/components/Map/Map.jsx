import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import './Map.css';

// ─── Custom Category Icons ──────────────────────────────────────
const CATEGORY_COLORS = {
  WAR_BATTLE: '#ef4444',         // red
  POLITICS: '#3b82f6',           // blue
  SCIENCE_INNOVATION: '#10b981', // green
  CULTURE_ART: '#8b5cf6',        // purple
  DISASTER: '#f97316',           // orange
  FAMOUS_BIRTH_DEATH: '#eab308', // gold
  UNKNOWN: '#9ca3af',            // gray
};

const createColoredIcon = (category) => {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.UNKNOWN;
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],   // Center the circle
    popupAnchor: [0, -10], // Popup emerges from just above the center
  });
};

// ─── Map Event Handler Component ────────────────────────────────
const MapEventHandler = ({ onViewportChange }) => {
  const map = useMapEvents({
    moveend: () => triggerViewportUpdate(map, onViewportChange),
    zoomend: () => triggerViewportUpdate(map, onViewportChange),
  });

  return null;
};

// Trigger viewport bounds calculation
const triggerViewportUpdate = (map, onViewportChange) => {
  if (!onViewportChange) return;
  const bounds = map.getBounds();
  
  onViewportChange({
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  });
};

// ─── Centering Assistant Component ──────────────────────────────
// Silently shifts the map center dynamically if props change
const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// ─── Main Map Component ─────────────────────────────────────────
const Map = ({ events = [], center = [0, 0], onViewportChange }) => {
  // Validate initial center
  const initialCenter = (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) 
    ? center 
    : [0, 0];

  return (
    <div className="map-wrapper">
      <MapContainer 
        center={initialCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        className="leaflet-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterUpdater center={center} />
        <MapEventHandler onViewportChange={onViewportChange} />

        {events.map((event) => {
          // Extract nested event data safely (handling ScoredEvent wrapping if applicable)
          const ev = event.event || event;
          
          if (ev.latitude == null || ev.longitude == null) return null;

          // Process description (max 100 characters)
          let snippet = ev.description || 'No description available.';
          if (snippet.length > 100) {
            snippet = snippet.substring(0, 97) + '...';
          }

          return (
            <Marker 
              key={ev.id || `${ev.latitude}-${ev.longitude}-${ev.title}`} 
              position={[ev.latitude, ev.longitude]}
              icon={createColoredIcon(ev.category)}
            >
              <Popup className="event-popup">
                <div className="popup-content">
                  <h3 className="popup-title">{ev.title || 'Historical Event'}</h3>
                  
                  <div className="popup-meta">
                    {ev.year !== null && <span className="popup-year">{ev.year}</span>}
                    {ev.category && <span className="popup-category">{ev.category.replace(/_/g, ' ')}</span>}
                    {event.confidenceScore != null && (
                      <span className="popup-score">
                        Score: {Math.round(event.confidenceScore)}
                      </span>
                    )}
                  </div>
                  
                  <p className="popup-description">{snippet}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;
