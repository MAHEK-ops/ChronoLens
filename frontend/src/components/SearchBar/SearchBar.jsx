import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, loading }) => {
  const [address, setAddress] = useState('');
  const [radiusKm, setRadiusKm] = useState(10); // Default to 10km

  const handleSearch = () => {
    if (address.trim()) {
      onSearch(address.trim(), radiusKm);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          onSearch(`${lat},${lng}`, radiusKm);
        },
        (error) => {
          console.error("Error obtaining geolocation", error);
          alert("Unable to retrieve your location. Please ensure location access is granted.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-group">
        <input
          type="text"
          className="search-input"
          placeholder="Enter a city, region, or address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        
        <select 
          className="radius-select"
          value={radiusKm} 
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          disabled={loading}
        >
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={25}>25 km</option>
          <option value={50}>50 km</option>
        </select>
        
        <button 
          className="search-btn"
          onClick={handleSearch} 
          disabled={loading || !address.trim()}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      <button 
        className="geo-btn"
        onClick={handleGeolocation}
        disabled={loading}
      >
        &#x1F4CD; Use my location
      </button>
    </div>
  );
};

export default SearchBar;
