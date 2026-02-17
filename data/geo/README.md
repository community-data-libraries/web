# Geographic Marker Data

This folder organizes community geographic markers in a consistent, machine-verifiable format to support contributions and downstream use in the site and external tooling.

## Structure

- `markers.geojson`: Canonical FeatureCollection of Point markers.
- `schema/marker.schema.json`: JSON Schema validating marker properties within each feature.
- `samples/`: Optional example files for testing and onboarding.

You may also choose to split markers into regional files later (e.g., `regions/NA/markers.geojson`), but start with a single canonical file for simplicity and easy indexing.

## GeoJSON Format

- Use RFC 7946 GeoJSON FeatureCollection with `Point` geometries.
- Coordinates are `[longitude, latitude]` in WGS84.
- Each feature MUST include `properties` matching the schema below.

### Required properties

- `id`: Stable unique string identifier (slug format recommended).
- `name`: Human-readable name.
- `category`: One of: `dataset`, `site`, `organization`, `event`, `other`.

### Optional properties

- `tags`: Array of strings.
- `region`: ISO 3166-1 alpha-2 country code or broader region label.
- `sourceUrl`: Canonical reference URL.
- `updatedAt`: ISO 8601 datetime string.

## Contribution Workflow

1. Add or edit features in `markers.geojson`.
2. Run validation locally:
   - GeoJSON lint: `npm run validate:geo`
   - Schema check: `npm run validate:schema`
3. Open a PR with a clear description of changes.

Guidelines:

- Prefer small, focused changes (a few markers at a time).
- Do not change `id` values of existing markers.
- Keep coordinates precise to at least 5 decimal places when available.
- Include `sourceUrl` when possible for traceability.

## Future Enhancements

- Regional sharding once file size grows (e.g., per-country files).
- GitHub Actions to auto-run validation on PRs.
- Automated ID collision checks and spatial duplicates.
