# Community Library Instantiation Flow

This flow turns a Decap CMS request into a provisioned community-library repository.

## End-to-End Pipeline

1. Editor opens Decap CMS at /web/admin.
2. Editor creates an entry in Community Library Requests.
3. Request starts at status: pending.
4. Reviewer verifies fields and switches status to approved.
5. GitHub Action runs scripts/instantiate-community-libraries.mjs.
6. Script creates a new repo from CDL_TEMPLATE_REPO via GitHub API.
7. Script writes config/community.yml in the new repo based on request filters.
8. Script updates request status to provisioned with repo URL (or failed with error).

## Geographic Filters Captured

The request form captures booleans for:
- state
- county
- zip_code
- school_district
- tract
- fips_code

And optional defaults:
- default_state
- default_county_fips
- default_zip_code
- default_school_district

## Required GitHub Secrets

Configure these in GitHub Actions settings for this repository:

- CDL_GITHUB_TOKEN: Personal access token or GitHub App token with permission to create repos and write contents.
- CDL_GITHUB_OWNER: Target owner/org where repos are created.
- CDL_TEMPLATE_REPO: Template repository in owner/repo format.

## Optional Netlify Secrets

If you want the script to attempt creating a Netlify site automatically:

- CDL_NETLIFY_CREATE_SITE=true
- CDL_NETLIFY_AUTH_TOKEN
- CDL_NETLIFY_TEAM_ID
- CDL_NETLIFY_SITE_NAME_PREFIX

If optional Netlify variables are absent, repo creation still succeeds and site creation is skipped.

## Notes

- Repos are created under CDL_GITHUB_OWNER.
- Request files live in src/content/community-library-requests.
- Only entries with status approved and no provisioned_repo_url are processed.
- Failed provisioning writes error text to last_error and sets status to failed.
