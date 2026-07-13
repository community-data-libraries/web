---
id: replace-with-request-id
title: New Community Library Request
community_name: Replace With Community Name
community_slug: replace-with-community-slug
contact_name: Replace With Requestor Name
contact_email: requestor@example.org
repository_name: ""
repository_description: ""

# Geographic tags: which master-library entries should appear in this library?
# These must match tags used in master library entries.
# Example: [knox-county, tennessee] will show any entry tagged with either.
geographic_tags: []

# Geographic filter UI controls shown in the community library interface
geographic_filters:
  filter_state: true
  filter_county: true
  filter_zip_code: true
  filter_school_district: false
  filter_tract: false
  filter_fips_code: false
  default_state: ""
  default_county_fips: ""
  default_zip_code: ""
  default_school_district: ""

implementation_notes: ""
status: pending
provisioned_repo_url: ""
provisioned_site_url: ""
last_error: ""
---

Add any extra context for the CDL provisioning team here.

## Workflow

1. Requestor fills out this form in Decap CMS and submits with `status: pending`.
2. CDL team reviews the request and updates status to `approved`.
3. A GitHub Action provisions a repo from the template and sets `status: provisioned`.
4. If provisioning fails, status is set to `failed` with details in `last_error`.

## How geographic filtering works

The `geographic_tags` field controls which master library entries appear in this community library.
Any master library entry that shares at least one tag with this list will be included.

To add a new geographic area:
1. Open relevant master library entries in the CMS.
2. Add a geographic tag (e.g. `my-county-name`) to the Tags field.
3. Add that same tag to `geographic_tags` in this request.
