import React from 'react';
import './EventCard.css';

const EventCard = ({ event }) => {
  // Guard clause against empty wrapper mapping (support both direct Event and mapped wrapper)
  const data = event.event || event;

  const yearDisplay = data.year != null ? data.year : 'Unknown date';
  const categoryDisplay = data.category ? data.category.replace(/_/g, ' ') : 'Unknown';
  const eraDisplay = data.era ? data.era.replace(/_/g, ' ') : 'Unknown Era';
  const score = data.confidenceScore != null ? Math.round(data.confidenceScore) : 0;
  
  // Truncate description to 150 characters
  let description = data.description || 'No description available.';
  if (description.length > 150) {
    description = description.substring(0, 147) + '...';
  }

  return (
    <div className="event-card">
      <div className="ec-header">
        <h3 className="ec-title">{data.title || 'Historical Event'}</h3>
        <span className="ec-year">{yearDisplay}</span>
      </div>

      <div className="ec-badges">
        <span className={`ec-badge category-${data.category || 'UNKNOWN'}`}>
          {categoryDisplay}
        </span>
        <span className="ec-badge era-badge">
          {eraDisplay}
        </span>
        {data.sourceName && (
          <span className="ec-badge source-badge">
            Source: {data.sourceName}
          </span>
        )}
      </div>

      <p className="ec-description">{description}</p>

      <div className="ec-footer">
        <div className="score-container">
          <div className="score-label">
            <span>Confidence Score</span>
            <span>{score}/100</span>
          </div>
          <div className="score-progress-bar">
            <div 
              className="score-progress-fill" 
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
