import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar/SearchBar';
import Map from '../components/Map/Map';
import Filters from '../components/Filters/Filters';
import Timeline from '../components/Timeline/Timeline';
import { fetchTimeline, fetchFilteredEvents, fetchViewportEvents } from '../api/timeline';
import './Home.css';

const Home = () => {
  const [location, setLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Default map center (e.g., somewhere neutral or a previous default)
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); 

  const [filters, setFilters] = useState({
    category: '',
    era: '',
    keyword: '',
    sortOrder: 'ASC'
  });

  const { state } = useLocation();

  // ─── Auto-Boot Component with Passed Search Variables ───────────
  // Resolves queries passed structurally from navigation (e.g. from Bookmarks route)
  useEffect(() => {
    if (state?.loadCoords) {
      // Execute the search pipeline implicitly
      handleSearch(state.loadCoords, state.loadRadius || 10);
      
      // Clean history state inherently so refresh does not trigger it again endlessly
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.loadCoords]);

  // ─── 1. Search (fetchTimeline) ──────────────────────────────────
  const handleSearch = async (inputStr, radiusKm) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { radiusKm, sortOrder: filters.sortOrder };
      
      // Determine if inputStr is coordinates or address
      if (/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(inputStr)) {
        const [lat, lng] = inputStr.split(',').map(n => parseFloat(n.trim()));
        payload.latitude = lat;
        payload.longitude = lng;
      } else {
        payload.address = inputStr;
      }

      const response = await fetchTimeline(payload);
      
      if (response && response.success) {
        setLocation(response.location);
        setEvents(response.timeline ? response.timeline.events : []);
        setMapCenter([response.location.latitude, response.location.longitude]);
        // Preserve sorting but reset semantic filters on new search
        setFilters(prev => ({ category: '', era: '', keyword: '', sortOrder: prev.sortOrder }));
      } else {
        setError(response.error || 'Failed to fetch timeline.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during search.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 2. Filter Change (fetchFilteredEvents) ─────────────────────
  // We wrap in useCallback so effect can trigger gracefully when filters change
  const applyFilters = useCallback(async () => {
    if (!location) return; // Need a location to filter

    setLoading(true);
    setError(null);
    try {
      const activeFilters = {};
      if (filters.category) activeFilters.category = filters.category;
      if (filters.era) activeFilters.era = filters.era;
      if (filters.keyword) activeFilters.keyword = filters.keyword;

      const response = await fetchFilteredEvents(location.id, activeFilters);
      
      if (response && response.success) {
        // fetchFilteredEvents returns raw events, TimelineBuilder sorted them.
        // We'll apply sorting manually if the API didn't sort them, but the backend doesn't support 
        // sortOrder directly in GET /events yet without explicit wiring. We will map them properly.
        let updatedEvents = response.events || [];
        
        // Sort manually for frontend immediate responsiveness if required:
        if (filters.sortOrder === 'DESC') {
          updatedEvents.sort((a, b) => (b.year || 0) - (a.year || 0));
        } else {
          updatedEvents.sort((a, b) => (a.year || 0) - (b.year || 0));
        }

        setEvents(updatedEvents);
      } else {
        setError(response.error || 'Failed to apply filters.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error filtering events.');
    } finally {
      setLoading(false);
    }
  }, [location, filters]);

  // Hook to automatically trigger filter fetch when filters state updates
  useEffect(() => {
    // Only attempt filter fetch if location is actually set
    if (location) {
      applyFilters();
    }
  }, [filters, location, applyFilters]);

  // ─── 3. Map Panning (fetchViewportEvents) ───────────────────────
  const handleViewportChange = async (bbox) => {
    // Suppress panning lookups when explicitly loading other full sets to avoid race conditions
    if (loading) return; 

    try {
      const response = await fetchViewportEvents(bbox);
      if (response && response.success && response.events) {
        setEvents((prevEvents) => {
          const existingIds = new Set(prevEvents.map(e => e.id || (e.event && e.event.id)));
          const newEvents = response.events.filter(e => {
            const id = e.id || (e.event && e.event.id);
            return !existingIds.has(id);
          });
          
          if (newEvents.length === 0) return prevEvents;

          const merged = [...prevEvents, ...newEvents];
          
          // Re-apply sort
          if (filters.sortOrder === 'DESC') {
            merged.sort((a, b) => ((b.year || b.event?.year || 0) - (a.year || a.event?.year || 0)));
          } else {
            merged.sort((a, b) => ((a.year || a.event?.year || 0) - (b.year || b.event?.year || 0)));
          }
          
          return merged;
        });
      }
    } catch (err) {
      console.error('Viewport fetch error:', err);
      // We don't typically want to blast the user with errors just for panning
    }
  };

  return (
    <div className="home-container">
      {/* Map Left View */}
      <div className="home-left-pane">
        <Map 
          events={events} 
          center={mapCenter} 
          onViewportChange={handleViewportChange} 
        />
      </div>

      {/* Timeline Right View */}
      <div className="home-right-pane">
        <div className="home-header">
          <h1>ChronoLens</h1>
          <p>Explore the historical intelligence of the world.</p>
        </div>

        <div className="search-section">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {error && (
          <div className="error-banner">
            <span>&#9888;</span> {error}
          </div>
        )}

        {location && (
          <div className="location-context">
            <h2>Showing history for: {location.placeName || 'Selected Location'}</h2>
          </div>
        )}

        <div className="filters-section">
          <Filters 
            filters={filters} 
            onFilterChange={setFilters} 
          />
        </div>

        <div className="timeline-section">
          <Timeline events={events} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Home;
