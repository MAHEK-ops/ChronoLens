-- ─── PostGIS Setup for ChronoLens ───────────────────────────────
-- Run AFTER Prisma migrations. Adds geometry columns + spatial indexes.
-- Requires PostGIS extension enabled on the database.

-- Enable PostGIS extension (must be superuser or have CREATE on db)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry(Point, 4326) columns
ALTER TABLE "Location"
  ADD COLUMN IF NOT EXISTS coordinates geometry(Point, 4326);

ALTER TABLE "HistoricalEvent"
  ADD COLUMN IF NOT EXISTS coordinates geometry(Point, 4326);

-- Create spatial indexes (GIST) for fast geospatial queries
CREATE INDEX IF NOT EXISTS location_coords_idx
  ON "Location" USING GIST(coordinates);

CREATE INDEX IF NOT EXISTS event_coords_idx
  ON "HistoricalEvent" USING GIST(coordinates);
