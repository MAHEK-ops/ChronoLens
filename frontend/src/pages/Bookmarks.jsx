import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookmarks, deleteBookmark } from '../api/bookmarks';
import './Bookmarks.css';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Hardcode userId = 1 for now as specified
  const USER_ID = 1;

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await getBookmarks(USER_ID);
        if (response && response.success) {
          // Response shape: { success, count, bookmarks: [...] }
          setBookmarks(response.bookmarks || []);
        } else {
          setError(response.error || 'Failed to fetch bookmarks.');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Error loading bookmarks.');
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const handleLoad = (bookmark) => {
    const coordsStr = `${bookmark.location.latitude},${bookmark.location.longitude}`;
    navigate('/', { 
      state: { 
        loadCoords: coordsStr,
        loadRadius: 10
      }
    });
  };

  const handleDelete = async (bookmarkId) => {
    // Optimistic UI Update
    const previousBookmarks = [...bookmarks];
    setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
    
    try {
      const result = await deleteBookmark(bookmarkId, USER_ID);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
      // Revert if API drops
      setBookmarks(previousBookmarks);
      alert('Failed to delete bookmark. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bookmarks-container">
        <div className="loading-state">Loading your saved locations...</div>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      <div className="bookmarks-header">
        <h1>Saved Locations</h1>
        <p>Your personal collection of historical coordinates.</p>
        {error && <div className="error-banner">{error}</div>}
      </div>

      {bookmarks.length === 0 && !error ? (
        <div className="empty-state">
          <span className="empty-icon">&#128161;</span>
          <h2>No bookmarks found</h2>
          <p>You haven't saved any locations yet. Go explore the timeline!</p>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-card">
              <div className="b-header">
                <h3>{bookmark.label || bookmark.location.placeName || 'Unknown Location'}</h3>
                <span className="date-badge">
                  {new Date(bookmark.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="b-body">
                <p>
                  <strong>Entity:</strong> {bookmark.location.placeName || 'Raw Coordinate'}
                </p>
                <p className="b-coords">
                  <strong>Coordinates:</strong> {bookmark.location.latitude.toFixed(4)}, {bookmark.location.longitude.toFixed(4)}
                </p>
              </div>

              <div className="b-footer">
                <button 
                  className="btn-load" 
                  onClick={() => handleLoad(bookmark)}
                >
                  &#128269; Map History
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(bookmark.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
