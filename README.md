# Community Data Libraries — Web

Astro-based site for Community Data Libraries (CDL). This repo also hosts geographic marker data for mapping resources.

## Development

```bash
npm install
npm run dev
```

## Geographic Markers

- Canonical markers stored in [data/geo/markers.geojson](data/geo/markers.geojson).
- Properties validated against [data/geo/schema/marker.schema.json](data/geo/schema/marker.schema.json).
- Lint and validate locally:

```bash
npm run validate:geo
```

Contribution guidelines are in [data/geo/README.md](data/geo/README.md).

## Documentation

- Netlify deployment: [docs/netlify.md](docs/netlify.md)
- Geo data branching guidance: [docs/geo-branching.md](docs/geo-branching.md)
- Community library structure: [docs/community-library-structure.md](docs/community-library-structure.md)
- Datasheet requirements: [docs/datasheet-requirements.md](docs/datasheet-requirements.md)
- Flowbite evaluation: [docs/flowbite-evaluation.md](docs/flowbite-evaluation.md)
- Aadya checklist: [docs/checklist-aadya.md](docs/checklist-aadya.md)
