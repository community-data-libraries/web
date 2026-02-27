#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { hint as geojsonHint } from '@mapbox/geojsonhint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const geoPath = path.join(root, 'data', 'geo', 'markers.geojson');
const schemaPath = path.join(root, 'data', 'geo', 'schema', 'marker.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function fail(msg) {
  console.error(`\n\x1b[31mError:\x1b[0m ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`\x1b[33mWarning:\x1b[0m ${msg}`);
}

function ok(msg) {
  console.log(`\x1b[32mOK:\x1b[0m ${msg}`);
}

try {
  const geoRaw = fs.readFileSync(geoPath, 'utf8');
  const geo = JSON.parse(geoRaw);
  const hints = geojsonHint(geoRaw);
  if (hints.length) {
    console.log('\nGeoJSON Lint Messages:');
    for (const h of hints) {
      const lvl = h.level === 'error' ? 'ERROR' : 'WARN';
      console.log(`- [${lvl}] ${h.message}`);
    }
  } else {
    ok('GeoJSON structure looks good');
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const validate = ajv.compile(schema);

  if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) {
    fail('markers.geojson must be a FeatureCollection with an array of features');
  }

  let errorsFound = 0;
  const ids = new Set();

  for (const [idx, feature] of geo.features.entries()) {
    if (!feature || feature.type !== 'Feature') {
      warn(`Feature at index ${idx} is not a valid Feature`);
      errorsFound++;
      continue;
    }
    if (
      !feature.geometry ||
      feature.geometry.type !== 'Point' ||
      !Array.isArray(feature.geometry.coordinates)
    ) {
      warn(`Feature ${idx} geometry must be a Point with [lon, lat] coordinates`);
      errorsFound++;
    }
    if (!validate(feature.properties)) {
      console.log(`\nProperty validation errors for feature ${idx}:`);
      for (const err of validate.errors ?? []) {
        console.log(`- ${err.instancePath} ${err.message}`);
      }
      errorsFound++;
    } else {
      const id = feature.properties.id;
      if (ids.has(id)) {
        warn(`Duplicate id detected: ${id}`);
        errorsFound++;
      } else {
        ids.add(id);
      }
    }
  }

  if (errorsFound > 0) {
    fail(`Validation found ${errorsFound} issue(s)`);
  } else {
    ok('All features passed schema and basic checks');
  }
} catch (e) {
  fail(e.message || String(e));
}
