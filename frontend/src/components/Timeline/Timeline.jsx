import React from 'react';
import EventCard from '../EventCard/EventCard';
import './Timeline.css';

const Timeline = ({ events, loading }) => {
  // ── Skeleton Loader ──
  if (loading) {
    return (
      <div className="timeline-container">
        {[1, 2, 3].map((n) => (
          <div key={n} className="timeline-skeleton">
            <div className="skel-header">
              <div className="skel-title"></div>
              <div className="skel-year"></div>
            </div>
            <div className="skel-badges">
              <div className="skel-badge"></div>
              <div className="skel-badge"></div>
            </div>
            <div className="skel-desc"></div>
            <div className="skel-desc short"></div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty State ──
  if (!events || events.length === 0) {
    return (
      <div className="timeline-empty-state">
        <div className="empty-icon">&#128269;</div>
        <h3>No historical events found</h3>
        <p>Try adjusting your search radius or changing your filters.</p>
      </div>
    );
  }

  // ── Events List ──
  return (
    <div className="timeline-container">
      {events.map((event, idx) => (
        <div key={event.id || idx} className="timeline-item">
          <div className="timeline-connector">
            <div className="timeline-dot"></div>
            {idx !== events.length - 1 && <div className="timeline-line"></div>}
          </div>
          <div className="timeline-content">
            <EventCard event={event} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
