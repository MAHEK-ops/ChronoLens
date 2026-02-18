# ChronoLens — "What Happened Here?"

## Project Overview

ChronoLens is a full-stack web application that takes any location on Earth (GPS coordinates or a plain address) and returns a rich, structured historical timeline of events that occurred at or near that location. It aggregates data from multiple open sources, cleans and deduplicates it, categorizes each event automatically, and presents a chronological timeline with confidence scores - pinned on an interactive map.

> Think of it as **Google Maps, but for history.**

---

## Problem Statement

Historical knowledge is scattered across Wikipedia, Wikidata, GeoNames, and other open databases. There is no single tool that:
- Takes a location as input
- Intelligently pulls and merges historical data from multiple free sources
- Cleans and deduplicates the results
- Categorizes events (war, science, culture, disaster, etc.)
- Returns a ranked, confidence-scored timeline pinned on a map

ChronoLens solves this.

---

## Scope

### Core Features (Must Have)

| Feature | Description |
|---|---|
| Location Input | Accept GPS coordinates or a plain address string |
| Geocoding | Convert address → coordinates using Nominatim (OpenStreetMap, free, no key) |
| Reverse Geocoding | Convert coordinates → human-readable place name |
| Multi-Source Aggregation | Fetch from Wikipedia GeoSearch API, Wikidata SPARQL API, GeoNames API - all free |
| Data Cleaning & Normalization | Deduplicate events, standardize date formats, filter noise |
| Event Extraction Engine | Extract structured fields (title, description, year, category) from raw API text |
| Event Categorization | Auto-classify into: War/Battle, Politics, Science/Innovation, Culture/Art, Disaster, Famous Births/Deaths |
| Timeline Builder | Sort chronologically; group by Era or Category |
| Confidence Scoring | Score each event based on number of sources and source reliability weight |
| Search & Filter | Filter by category, time period; keyword search within results |
| Caching System | Cache results by location to avoid redundant API calls (Redis) |
| Graceful Failure Handling | If one API fails, fall back to remaining sources - never crash |

### Advanced Features (Bonus)

| Feature | Description |
|---|---|
| Story Mode | Narrate the timeline as a readable historical paragraph |
| Bookmark Locations | Save and retrieve searched locations per user |
| Compare Locations | Side-by-side historical richness comparison of two places |
| Trend Analysis | Show which event category dominates a location |
| Map Visualization | Events pinned on interactive Leaflet.js map with clustering |
| Radius Search | PostGIS-powered query - fetch only events within exact km radius |
| Viewport Fetch | Load only events visible in the current map viewport as user pans |

---

## APIs Used (All Free, No Auth Required)

| API | Purpose | Endpoint |
|---|---|---|
| Wikipedia GeoSearch | Articles near coordinates | `https://en.wikipedia.org/w/api.php` |
| Wikidata SPARQL | Structured historical events with dates and categories | `https://query.wikidata.org/sparql` |
| GeoNames | Georeferenced Wikipedia entries, 240 languages | `http://api.geonames.org/findNearbyWikipediaJSON` |
| Nominatim (OSM) | Free address → coordinates geocoding | `https://nominatim.openstreetmap.org/search` |

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | Node.js + Express | Lightweight, async-friendly for parallel API calls |
| Database | PostgreSQL + PostGIS | Native geospatial queries - radius search, viewport fetch, distance sorting |
| ORM | Prisma | Clean schema definition, PostGIS support, great developer experience |
| Cache | Redis | Cache timeline results per location, reduce external API calls |
| HTTP Client | Axios | API calls to Wikipedia, Wikidata, GeoNames |
| Frontend | React.js | Component-based UI |
| Map | React Leaflet | Free interactive map with marker clustering, no API key needed |

---

## Backend Architecture

```
Controller Layer   →   handles HTTP requests and responses
       ↓
Service Layer      →   business logic, orchestration, design patterns live here
       ↓
Repository Layer   →   all database access via Prisma + PostGIS queries
       ↓
External APIs      →   Wikipedia, Wikidata, GeoNames, Nominatim
```

### OOP Principles Applied

| Principle | How it is applied |
|---|---|
| **Encapsulation** | Each class owns its data; internal state is private, exposed only through methods |
| **Abstraction** | `HistoricalEventFetcher` base class hides all API-specific logic from the aggregator |
| **Inheritance** | `WikipediaFetcher`, `WikidataFetcher`, `GeoNamesFetcher` extend the base fetcher class |
| **Polymorphism** | `EventAggregatorService` calls `fetchByCoordinates()` on any fetcher without knowing which one it is |

### Design Patterns Used

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `HistoricalEventFetcher` subclasses | Swap data sources at runtime without changing aggregator logic |
| **Adapter** | `WikipediaAdapter`, `WikidataAdapter`, `GeoNamesAdapter` | Each API returns different JSON - adapters normalize all into one `HistoricalEvent` shape |
| **Factory** | `EventFactory` | One central place to create event objects, picks the right adapter automatically |
| **Decorator** | `ScoredEvent` wraps `HistoricalEvent` | Adds confidence score without modifying the base event class |
| **Template Method** | Base fetcher `fetch()` pipeline | Defines the steps; subclasses override only what differs per API |

---

## Core Domain Entities

| Entity | Description |
|---|---|
| `Location` | lat, lng, address, place name, PostGIS point geometry |
| `HistoricalEvent` | title, description, year, category, era, source, coordinates |
| `EventSource` | source name, reliability weight, base URL |
| `Timeline` | ordered collection of scored events for a location |
| `Category` | WAR, POLITICS, SCIENCE, CULTURE, DISASTER, BIRTH_DEATH |
| `Era` | ANCIENT, MEDIEVAL, COLONIAL, MODERN, CONTEMPORARY |
| `ScoredEvent` | wraps HistoricalEvent + confidence score + contributing sources |

---

## Why PostgreSQL + PostGIS

Standard databases store lat/lng as plain numbers. PostGIS turns PostgreSQL into a spatial engine:

- **Radius search** - `ST_DWithin(point, target, radius)` - fetch only events within exact km
- **Distance sort** - `ST_Distance(point, target)` - return events ordered by proximity
- **Viewport query** - `ST_MakeEnvelope(west, south, east, north)` - load only events visible in current map view
- **Clustering** - `ST_ClusterDBSCAN` - group nearby pins automatically on the map

This is what makes the map feel like a real product rather than a basic project.