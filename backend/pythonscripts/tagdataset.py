#!/usr/bin/env python3
"""
Simple dataset tagger.

What it does:
- Reads one or more YAML files from backend/data/sources
- Uses the requests library to fetch text content from any URLs found in the YAML
- Collects text from YAML fields + URL page content
- Generates keyword-based description tags using canonical category names
- Writes tags back to each file as: description_tags: {Category: true/false, ...}

Usage:
    python backend/pythonscripts/tagdataset.py all
    python backend/pythonscripts/tagdataset.py usda-milk-production.yml
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

import requests
import yaml


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_SOURCES_DIR = SCRIPT_DIR.parent / "data" / "sources"


# Canonical category names — must match the keys used in all source YAML files.
CANONICAL_CATEGORIES = [
    "Agriculture",
    "Business & Finance",
    "Children & Families",
    "Economy",
    "Election",
    "PreK-12 Education",
    "Energy & Environment",
    "Government Administration",
    "Health & Social Services",
    "Higher Education",
    "Historic Preservation",
    "Housing & Buildings",
    "Labor & Workforce Development",
    "Law & Public Safety",
    "Parks & Recreation",
    "Population Data",
    "Public Utilities",
    "Restaurant and Food Service",
    "Transportation",
]

# Maps each canonical category to the keywords that trigger it.
TAG_RULES: dict[str, list[str]] = {
    "Agriculture": [
        "agriculture", "farm", "crop", "usda", "rural", "livestock",
        "commodity", "milk", "dairy", "forestry", "fishery",
    ],
    "Business & Finance": [
        "business", "finance", "revenue", "earnings", "commercial",
        "naics", "establishment", "trade", "industry",
    ],
    "Children & Families": [
        "child", "children", "family", "families", "youth", "juvenile",
        "infant", "pediatric", "foster", "daycare",
    ],
    "Economy": [
        "economic", "economy", "gdp", "income", "poverty", "gross domestic",
        "wages", "labor force", "consumer price", "inflation",
    ],
    "Election": [
        "election", "vote", "voter", "ballot", "candidate",
        "precinct", "redistrict", "polling",
    ],
    "PreK-12 Education": [
        "school", "district", "nces", "lea", "k-12", "prek",
        "elementary", "secondary", "achievement", "enrollment", "naep",
    ],
    "Energy & Environment": [
        "environment", "epa", "air quality", "water quality", "superfund",
        "pollution", "emission", "toxic", "energy", "climate", "weather",
        "noaa", "temperature", "precipitation", "storm", "wildlife",
        "species", "bird", "biodiversity", "ebird", "habitat", "ecology",
        "greenhouse", "renewable",
    ],
    "Government Administration": [
        "government", "census", "bureau", "federal", "state agency",
        "municipal", "public records", "acs", "american community survey",
        "fips", "administrative", "county government",
    ],
    "Health & Social Services": [
        "health", "cdc", "disease", "mortality", "obesity", "diabetes",
        "chronic", "brfss", "risk factor", "social service", "welfare",
        "disability", "mental health", "substance", "hospital", "clinic",
        "medicaid", "medicare",
    ],
    "Higher Education": [
        "college", "university", "higher education", "postsecondary",
        "ipeds", "graduate", "undergraduate", "tuition",
    ],
    "Historic Preservation": [
        "historic", "preservation", "heritage", "landmark",
        "archaeological", "national register",
    ],
    "Housing & Buildings": [
        "housing", "rent", "mortgage", "homeowner", "vacancy",
        "residential", "building", "construction", "real estate",
        "affordable housing", "eviction",
    ],
    "Labor & Workforce Development": [
        "labor", "workforce", "occupation", "payroll", "bls", "qcew",
        "laus", "job", "worker", "unemployment", "employment", "wage",
        "apprenticeship",
    ],
    "Law & Public Safety": [
        "crime", "fbi", "arrest", "offense", "law enforcement", "ucr",
        "nibrs", "violent", "property crime", "safety", "police",
        "fire department", "emergency", "incarceration", "court",
    ],
    "Parks & Recreation": [
        "park", "recreation", "trail", "open space", "outdoor",
        "national park", "greenway", "playground", "sports facility",
    ],
    "Population Data": [
        "population", "demographic", "household", "race", "ethnicity",
        "age", "sex", "gender", "hispanic", "origin", "migration",
        "fertility", "birth rate", "death rate", "census population",
    ],
    "Public Utilities": [
        "utility", "water system", "sewer", "wastewater", "electricity",
        "natural gas", "broadband", "internet", "telecom", "public works",
    ],
    "Restaurant and Food Service": [
        "restaurant", "food service", "dining", "food safety",
        "inspection", "catering", "foodborne", "grocery",
    ],
    "Transportation": [
        "transportation", "transit", "road", "highway", "traffic",
        "vehicle", "commute", "rail", "aviation", "airport", "bridge",
        "bicycle", "pedestrian", "freight",
    ],
}

def find_yaml_files(sources_dir: Path, one_file: str | None) -> list[Path]:
    if one_file:
        file_path = Path(one_file)
        return [file_path] if file_path.exists() else []
    return sorted(sources_dir.glob("*.yml"))


def extract_urls(node: Any) -> list[str]:
    """Recursively find URL-like values in a YAML object."""
    urls: list[str] = []
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str) and ("url" in str(key).lower() or "link" in str(key).lower()):
                if value.startswith("http://") or value.startswith("https://"):
                    urls.append(value)
            urls.extend(extract_urls(value))
    elif isinstance(node, list):
        for item in node:
            urls.extend(extract_urls(item))
    return sorted(set(urls))


def html_to_text(html: str) -> str:
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_url_text(url: str, timeout: int, max_chars: int) -> str:
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return html_to_text(response.text)[:max_chars]
    except Exception as exc:
        print(f"  - Could not fetch {url}: {exc}")
        return ""


def build_text_blob(data: dict[str, Any], timeout: int, max_url_text: int) -> str:
    parts: list[str] = []

    for key in ["title", "short_title", "description"]:
        value = data.get(key)
        if isinstance(value, str):
            parts.append(value)

    provider = data.get("provider", {})
    if isinstance(provider, dict):
        for key in ["name", "agency"]:
            value = provider.get(key)
            if isinstance(value, str):
                parts.append(value)

    for url in extract_urls(data):
        parts.append(fetch_url_text(url, timeout=timeout, max_chars=max_url_text))

    return "\n".join(parts).lower()


def infer_tags(text: str) -> dict[str, bool]:
    """Return a full canonical dict with every category set to true or false."""
    matched: set[str] = set()
    for category, keywords in TAG_RULES.items():
        if any(word in text for word in keywords):
            matched.add(category)
    return {category: (category in matched) for category in CANONICAL_CATEGORIES}


def process_file(path: Path, timeout: int, max_url_text: int, dry_run: bool) -> None:
    print(f"\nProcessing: {path}")

    with path.open("r", encoding="utf-8") as file:
        data = yaml.safe_load(file) or {}

    if not isinstance(data, dict):
        print("  - Skipped (YAML root is not an object)")
        return

    text_blob = build_text_blob(data, timeout=timeout, max_url_text=max_url_text)
    tags = infer_tags(text_blob)

    active = [cat for cat, on in tags.items() if on]
    print(f"  - Tags: {active if active else '(none matched)'}")

    if dry_run:
        return

    data["description_tags"] = tags

    with path.open("w", encoding="utf-8") as file:
        yaml.safe_dump(data, file, sort_keys=False, allow_unicode=False)

    print("  - Updated file")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python backend/pythonscripts/tagdataset.py all")
        print("  python backend/pythonscripts/tagdataset.py path/to/dataset.yml")
        sys.exit(1)

    target = sys.argv[1]

    if target == "all":
        files = find_yaml_files(sources_dir=DEFAULT_SOURCES_DIR, one_file=None)
    else:
        #accept filename or path
        target_path = Path(target)
        if not target_path.is_absolute() and not target_path.exists():
            target_path = DEFAULT_SOURCES_DIR / target_path
        files = find_yaml_files(sources_dir=DEFAULT_SOURCES_DIR, one_file=str(target_path))

    if not files:
        print("No YAML files found.")
        return

    for path in files:
        process_file(path=path, timeout=10, max_url_text=4000, dry_run=False)


if __name__ == "__main__":
    main()
