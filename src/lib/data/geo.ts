import fs from 'node:fs';
import path from 'node:path';
import type { GeoMarkerCollection } from '@lib/types/geo';

/**
 * Load the canonical GeoJSON markers from data/geo/markers.geojson.
 * This runs at build time on the server.
 */
export function loadGeoMarkers(): GeoMarkerCollection {
  const root = path.resolve(process.cwd());
  const geoPath = path.join(root, 'data', 'geo', 'markers.geojson');
  const raw = fs.readFileSync(geoPath, 'utf8');
  const json = JSON.parse(raw) as GeoMarkerCollection;
  return json;
}
