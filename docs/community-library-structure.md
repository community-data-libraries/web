# Community Library Structure

Content is managed via Astro Content Collections. The current collection is `master-library` defined in `src/content/config.ts`.

## Frontmatter Schema
Required:
- `title`: string
- `description`: string
- `category`: one of `dataset`, `tool`, `guide`, `paper`

Optional:
- `author`: string
- `publishedDate`: date
- `tags`: array of strings
- `url`: URL
- `fileUrl`: URL
- `featured`: boolean
- `difficulty`: `beginner` | `intermediate` | `advanced`
- `language`: string

## Adding a Resource
1. Create a markdown file under `src/content/master-library/`.
2. Include frontmatter fields per schema.
3. Add body content in markdown.

## Future: Community Submissions
For a community-contributed library, mirror the schema with a new collection (e.g., `community-library`) and add submission flow (form → PR or CMS). For now, use `master-library` and tag submissions via `tags`.
