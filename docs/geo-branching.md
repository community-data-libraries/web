# Geographic Identifiers: Branch vs Separate Repo

This project stores geographic marker data under `data/geo/`.

## Options
- Branch (`geo-data`): Keep data in this repo but isolate heavy changes in a dedicated branch. Pros: shared CI/validation, single issue tracker; Cons: larger repo history.
- Separate repo (`cdl-geo`): Split into a focused data repo. Pros: lighter web repo, independent data release cadence; Cons: cross-repo coordination.

## Recommendation
Start with a dedicated branch (e.g., `geo-data`) in this repo to leverage existing validation (`npm run validate:geo`) and keep PR workflows simple. If data volume or release cadence becomes significantly different, migrate `data/geo/` to a separate repo with its own CI.

## Practical Steps
- Create branch `geo-data`.
- Enforce PR checks running `npm run validate:geo`.
- Use `data/geo/schema/marker.schema.json` as the authoritative schema.
