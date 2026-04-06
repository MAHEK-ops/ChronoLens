import React, { useState, useEffect } from 'react';
import './Filters.css';

const CATEGORIES = [
  'WAR_BATTLE', 'POLITICS', 'SCIENCE_INNOVATION', 
  'CULTURE_ART', 'DISASTER', 'FAMOUS_BIRTH_DEATH', 'UNKNOWN'
];

const ERAS = [
  'ANCIENT', 'CLASSICAL', 'MEDIEVAL', 
  'EARLY_MODERN', 'MODERN', 'CONTEMPORARY'
];

const Filters = ({ filters, onFilterChange }) => {
  const [keywordContent, setKeywordContent] = useState(filters.keyword || '');

  // 400ms Debounce for keyword input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keywordContent !== filters.keyword) {
        onFilterChange({ ...filters, keyword: keywordContent });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [keywordContent, filters, onFilterChange]);

  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleClear = () => {
    setKeywordContent('');
    onFilterChange({
      category: '',
      era: '',
      keyword: '',
      sortOrder: 'ASC'
    });
  };

  const toggleSort = () => {
    handleChange('sortOrder', filters.sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  return (
    <div className="filters-container">
      <div className="filters-grid">
        <div className="filter-group">
          <label>Category</label>
          <select 
            value={filters.category || ''} 
            onChange={(e) => handleChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Era</label>
          <select 
            value={filters.era || ''} 
            onChange={(e) => handleChange('era', e.target.value)}
          >
            <option value="">All Eras</option>
            {ERAS.map(era => (
              <option key={era} value={era}>{era.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="filter-group keyword-group">
          <label>Keyword</label>
          <input 
            type="text" 
            placeholder="Search events..."
            value={keywordContent}
            onChange={(e) => setKeywordContent(e.target.value)}
          />
        </div>
      </div>

      <div className="filters-actions">
        <button className="sort-btn" onClick={toggleSort}>
          Sort: {filters.sortOrder === 'ASC' ? 'Oldest First ↓' : 'Newest First ↑'}
        </button>
        <button className="clear-btn" onClick={handleClear}>
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default Filters;
