import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";

const REQUESTS_DIR = path.resolve(process.cwd(), "src/content/community-library-requests");
const GITHUB_API = "https://api.github.com";
const NETLIFY_API = "https://api.netlify.com/api/v1";

const requiredEnv = ["CDL_GITHUB_TOKEN", "CDL_GITHUB_OWNER", "CDL_TEMPLATE_REPO"];

function assertEnv() {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}

function slugify(input) {
  return String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseFrontmatter(raw, fileName) {
  if (!raw.startsWith("---\n")) {
    throw new Error(`${fileName} is missing YAML frontmatter.`);
  }

  const secondFence = raw.indexOf("\n---\n", 4);
  if (secondFence === -1) {
    throw new Error(`${fileName} frontmatter is not terminated.`);
  }

  const frontmatterText = raw.slice(4, secondFence);
  const body = raw.slice(secondFence + 5);
  const data = yaml.parse(frontmatterText) ?? {};
  return { data, body };
}

function toMarkdown(data, body) {
  const frontmatter = yaml.stringify(data, { lineWidth: 0 }).trimEnd();
  const normalizedBody = body.startsWith("\n") ? body : `\n${body}`;
  return `---\n${frontmatter}\n---${normalizedBody}`;
}

function boolValue(value) {
  return value === true || String(value).toLowerCase() === "true";
}

function getField(requestData, key) {
  if (requestData[key] !== undefined && requestData[key] !== null) {
    return requestData[key];
  }
  if (
    requestData.geographic_filters &&
    typeof requestData.geographic_filters === "object" &&
    requestData.geographic_filters[key] !== undefined &&
    requestData.geographic_filters[key] !== null
  ) {
    return requestData.geographic_filters[key];
  }
  return null;
}

function parseTemplateRepo(templateRepo) {
  const [owner, repo] = String(templateRepo).split("/");
  if (!owner || !repo) {
    throw new Error("CDL_TEMPLATE_REPO must be in the format owner/repo");
  }
  return { owner, repo };
}

async function githubRequest(token, endpoint, method = "GET", body = undefined) {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "cdl-community-library-instantiator",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API ${method} ${endpoint} failed: ${response.status} ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function createRepoFromTemplate({ token, templateOwner, templateRepo, owner, repoName, description }) {
  return githubRequest(token, `/repos/${templateOwner}/${templateRepo}/generate`, "POST", {
    owner,
    name: repoName,
    description,
    private: false,
    include_all_branches: false,
  });
}

async function getFileSha({ token, owner, repo, filePath }) {
  try {
    const response = await githubRequest(token, `/repos/${owner}/${repo}/contents/${filePath}`);
    return response?.sha ?? null;
  } catch (error) {
    const message = String(error?.message ?? "");
    if (message.includes("404")) {
      return null;
    }
    throw error;
  }
}

async function upsertRepositoryFile({ token, owner, repo, filePath, content, message }) {
  const sha = await getFileSha({ token, owner, repo, filePath });
  return githubRequest(token, `/repos/${owner}/${repo}/contents/${filePath}`, "PUT", {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    sha: sha ?? undefined,
  });
}

function buildCommunityConfig(requestData, generatedRepoUrl) {
  const slug = requestData.community_slug || slugify(requestData.community_name || requestData.title || "community-library");
  const config = {
    community: {
      name: requestData.community_name || requestData.title || slug,
      slug,
      repo_url: generatedRepoUrl,
      contact_email: requestData.contact_email || null,
      created_by_request: requestData.id || null,
      generated_at: new Date().toISOString(),
    },
    location_filters: {
      state: boolValue(getField(requestData, "filter_state")),
      county: boolValue(getField(requestData, "filter_county")),
      zip_code: boolValue(getField(requestData, "filter_zip_code")),
      school_district: boolValue(getField(requestData, "filter_school_district")),
      tract: boolValue(getField(requestData, "filter_tract")),
      fips_code: boolValue(getField(requestData, "filter_fips_code")),
      default_state: getField(requestData, "default_state") || null,
      default_county_fips: getField(requestData, "default_county_fips") || null,
      default_zip_code: getField(requestData, "default_zip_code") || null,
      default_school_district: getField(requestData, "default_school_district") || null,
    },
    notes: requestData.implementation_notes || null,
  };

  return yaml.stringify(config, { lineWidth: 0 });
}

async function maybeCreateNetlifySite({ requestData, repoFullName }) {
  if (String(process.env.CDL_NETLIFY_CREATE_SITE || "false").toLowerCase() !== "true") {
    return null;
  }

  const token = process.env.CDL_NETLIFY_AUTH_TOKEN;
  const teamId = process.env.CDL_NETLIFY_TEAM_ID;
  if (!token || !teamId) {
    throw new Error("CDL_NETLIFY_CREATE_SITE is true, but CDL_NETLIFY_AUTH_TOKEN or CDL_NETLIFY_TEAM_ID is missing.");
  }

  const siteNamePrefix = process.env.CDL_NETLIFY_SITE_NAME_PREFIX || "cdl-community";
  const slug = requestData.community_slug || slugify(requestData.community_name || requestData.title || "library");
  const siteName = `${siteNamePrefix}-${slug}`.slice(0, 63);

  const response = await fetch(`${NETLIFY_API}/sites`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "cdl-community-library-instantiator",
    },
    body: JSON.stringify({
      account_slug: teamId,
      name: siteName,
      repo: {
        provider: "github",
        repo_path: repoFullName,
        repo_branch: "main",
      },
      build_settings: {
        cmd: "npm run build",
        dir: "dist",
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Netlify site creation failed: ${response.status} ${details}`);
  }

  return response.json();
}

async function processRequestFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  const fileName = path.basename(filePath);
  const { data, body } = parseFrontmatter(raw, fileName);

  const status = String(data.status || "pending").toLowerCase();
  const alreadyProvisioned = Boolean(data.provisioned_repo_url);
  if (status !== "approved" || alreadyProvisioned) {
    return { filePath, skipped: true, reason: `status=${status}, provisioned=${alreadyProvisioned}` };
  }

  const githubToken = process.env.CDL_GITHUB_TOKEN;
  const owner = process.env.CDL_GITHUB_OWNER;
  const { owner: templateOwner, repo: templateRepo } = parseTemplateRepo(process.env.CDL_TEMPLATE_REPO);

  const communityName = data.community_name || data.title;
  if (!communityName) {
    throw new Error(`${fileName} must include community_name or title.`);
  }

  const baseSlug = data.community_slug || slugify(communityName);
  const repoName = data.repository_name || `community-library-${baseSlug}`;
  const description = data.repository_description || `Community Data Library for ${communityName}`;

  try {
    const repo = await createRepoFromTemplate({
      token: githubToken,
      templateOwner,
      templateRepo,
      owner,
      repoName,
      description,
    });

    const repoFullName = `${owner}/${repoName}`;
    const communityConfig = buildCommunityConfig(data, repo.html_url);

    await upsertRepositoryFile({
      token: githubToken,
      owner,
      repo: repoName,
      filePath: "config/community.yml",
      content: communityConfig,
      message: `chore: configure community settings for ${communityName}`,
    });

    let netlifySite = null;
    try {
      netlifySite = await maybeCreateNetlifySite({ requestData: data, repoFullName });
    } catch (netlifyError) {
      console.warn(`Netlify provisioning skipped/failed for ${fileName}: ${netlifyError.message}`);
    }

    const updated = {
      ...data,
      status: "provisioned",
      provisioned_at: new Date().toISOString(),
      provisioned_repo_url: repo.html_url,
      provisioned_repo_name: repoFullName,
      provisioned_site_url: netlifySite?.ssl_url || netlifySite?.url || data.provisioned_site_url || null,
      last_error: null,
    };

    await writeFile(filePath, toMarkdown(updated, body), "utf8");

    return {
      filePath,
      skipped: false,
      repo: repo.html_url,
      site: netlifySite?.ssl_url || netlifySite?.url || null,
    };
  } catch (error) {
    const updated = {
      ...data,
      status: "failed",
      last_error: String(error?.message || error),
      failed_at: new Date().toISOString(),
    };
    await writeFile(filePath, toMarkdown(updated, body), "utf8");
    return {
      filePath,
      skipped: false,
      failed: true,
      error: updated.last_error,
    };
  }
}

async function main() {
  assertEnv();

  const files = (await readdir(REQUESTS_DIR))
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(REQUESTS_DIR, name));

  if (files.length === 0) {
    console.log("No request files found.");
    return;
  }

  const results = [];
  for (const filePath of files) {
    const result = await processRequestFile(filePath);
    results.push(result);
    if (result.skipped) {
      console.log(`SKIP ${path.basename(filePath)}: ${result.reason}`);
      continue;
    }
    if (result.failed) {
      console.log(`FAIL ${path.basename(filePath)}: ${result.error}`);
      continue;
    }
    console.log(`OK   ${path.basename(filePath)} => ${result.repo}`);
  }

  const failures = results.filter((r) => r.failed).length;
  console.log(`Processed ${results.length} request file(s), failures: ${failures}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
