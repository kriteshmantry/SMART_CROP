import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getNearestDistrict } from '../utils/locationUtils';
import { MapPin, LocateFixed, CheckCircle2 } from 'lucide-react';

// Fix for default Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks and drop movable marker
const LocationMarker = ({ position, setPosition, onDistrictFound }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom(), { animate: true });
      const district = getNearestDistrict(e.latlng.lat, e.latlng.lng);
      onDistrictFound(district);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

// Component to dynamically zoom map when center updates
const AutoCenter = ({ center, zoomLevel }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoomLevel, { animate: true, duration: 1.5 });
    }
  }, [center, zoomLevel, map]);
  return null;
};

const LocationPickerMap = ({ onLocationSelect, initialDistrict = 'Cuttack' }) => {
  // Default to Odisha center approx
  const defaultCenter = [20.296, 85.824]; 
  const [position, setPosition] = useState(null);
  const [currentDistrict, setCurrentDistrict] = useState(initialDistrict);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoomLevel, setZoomLevel] = useState(6);

  const handleDistrictFound = (district) => {
    setCurrentDistrict(district);
    // Removed immediate auto-close so the user can look around or save changes.
  };

  const locateUser = (e) => {
    e.preventDefault();
    if (!('geolocation' in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng = { lat: latitude, lng: longitude };
        
        // Dynamically zoom into the specific coordinate, drop marker
        setPosition(latlng);
        setMapCenter(latlng);
        setZoomLevel(16); 
        
        // Update dynamic location name locally
        const nearest = getNearestDistrict(latitude, longitude);
        handleDistrictFound(nearest);
        
        // Revert button text to 'Auto Detect'
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS Error: ", err);
        alert("Unable to fetch location. Please tap your location on the map.");
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const [isSaved, setIsSaved] = useState(false);

  const handleSaveChanges = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      if (onLocationSelect) {
        onLocationSelect(currentDistrict);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center justify-between px-1">
        <label className="block text-lg font-bold text-gray-700 uppercase flex items-center">
          <MapPin className="h-4 w-4 mr-1 text-red-500" />
          Farm Location: <span className="text-emerald-700 font-black ml-1 uppercase">{currentDistrict}</span>
        </label>
        
        <button
          type="button"
          onClick={locateUser}
          disabled={isLocating}
          className="focus:outline-none transition-all"
        >
          {isLocating ? (
            <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-lg font-bold shadow-sm animate-pulse">
              Locating...
            </span>
          ) : (
            <span className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-bold text-lg hover:underline">
              <LocateFixed className="h-3 w-3 mr-1" /> Auto Detect
            </span>
          )}
        </button>
      </div>

      <div className="h-[240px] w-full rounded-xl overflow-hidden border-2 border-emerald-100 shadow-inner relative z-0 mb-1">
        <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationMarker position={position} setPosition={setPosition} onDistrictFound={handleDistrictFound} />
          <AutoCenter center={mapCenter} zoomLevel={zoomLevel} />
        </MapContainer>
      </div>
      
      <button 
        type="button"
        onClick={handleSaveChanges}
        disabled={isSaved}
        className={`w-full font-bold py-2 rounded-xl text-xl transition-all shadow-sm flex items-center justify-center mt-1 transform active:scale-95 ${
          isSaved ? 'bg-green-500 text-white scale-95' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        <CheckCircle2 className={`h-5 w-5 mr-2 transition-transform duration-300 ${isSaved ? 'scale-125 text-white' : ''}`} /> 
        {isSaved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
};

export default LocationPickerMap;
