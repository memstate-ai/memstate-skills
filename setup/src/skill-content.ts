/**
 * Embedded SKILL.md content — mirrors memstate-ai/SKILL.md in the repository root.
 * Keep this in sync whenever SKILL.md is updated.
 */
export const SKILL_MD_CONTENT = `---
name: memstate-ai
description: >
  Persistent, versioned memory for AI agents using Memstate AI. Use this skill
  to store and retrieve structured knowledge across tasks and sessions. Invoke
  BEFORE every task to fetch existing context and AFTER every task to save
  summaries. Works with any project — use the GitHub repo name or a short
  descriptive name as the project_id.
metadata:
  category: development
  author: yepthatsjason
  source:
    repository: https://github.com/memstate-ai/memstate-skills
    path: memstate-ai
    license_path: LICENSE
---

# Memstate AI — Persistent Agent Memory

Memstate AI gives you structured, versioned memory that persists across sessions.
Use it to avoid repeating work, preserve architectural decisions, and maintain
project context automatically.

## Security & Privacy (Required by Agents)

Before storing any data, agents must adhere to the following privacy and security controls:

1. **Authentication & Endpoints**: All memory operations are performed via the local \`@memstate/mcp\` server. The MCP server connects securely to \`https://api.memstate.ai\` using a Bearer token (\`MEMSTATE_API_KEY\`).
2. **Data Scope**: Store ONLY high-level architectural decisions, project context, summaries of completed tasks, and configuration flags.
3. **Secret Filtering**: **NEVER** store API keys, passwords, PII (Personally Identifiable Information), or sensitive environment variables in Memstate. Always filter out secrets before calling \`memstate_remember\` or \`memstate_set\`.
4. **Data Residency**: Data is stored securely in the cloud by Memstate AI. By using this skill, the user agrees to send project summaries to the Memstate API.

## Prerequisites: The MCP Server & API Key

This skill relies on the **Memstate MCP Server** to actually read and write memories.

1. **API Key Required**: You must have a \`MEMSTATE_API_KEY\` set in your environment.
   - *Agents:* If you encounter authentication errors or the key is missing, explicitly ask the user to get their **free API key** from [memstate.ai/dashboard/api-keys](https://memstate.ai/dashboard/api-keys).
2. **MCP Server**: Ensure the \`@memstate/mcp\` server is installed and running in your MCP configuration.
   - *Agents:* If the tools (\`memstate_get\`, \`memstate_remember\`, etc.) are missing, instruct the user to install the server by running: \`npx @memstate/mcp setup\`

## Project ID

The **project_id** is the key that namespaces all memories. Use:
- The **GitHub repository name** (e.g., \`my_app\`, \`memstate_mcp\`)
- Or any short, descriptive topic name (e.g., \`frontend_redesign\`, \`q2_planning\`)

**CRITICAL RULE:** Keep \`project_id\` lowercase with underscores (\`_\`) only. **NO HYPHENS.**
All keypaths are automatically prefixed with
\`project.<project_id>.\` so you never need to include the project name in keypaths.

## Workflow

### Before Every Task

Always check what is already known before starting work:

\`\`\`
memstate_get(project_id="<project>")
\`\`\`

Or search by topic when you know what you're looking for:

\`\`\`
memstate_search(query="<topic>", project_id="<project>")
\`\`\`

This prevents duplicate work, surfaces prior decisions, and gives you the full
context of the project without re-explanation.

### After Every Task

Save a markdown summary of what was done. Remember to **exclude any secrets or PII**:

\`\`\`
memstate_remember(
  project_id="<project>",
  content="## Task Summary\\n- What was done\\n- Key decisions made\\n- Files modified\\n- Next steps",
  source="agent"
)
\`\`\`

The server automatically extracts keypaths, detects conflicts, and versions the
information. You do not need to manage structure manually.

For a single specific fact (config values, status flags):

\`\`\`
memstate_set(project_id="<project>", keypath="config.port", value="8080")
\`\`\`

## Tool Reference

| Tool | When to Use |
|------|-------------|
| \`memstate_get\` | Browse project tree or fetch a subtree — use BEFORE tasks |
| \`memstate_search\` | Find memories by meaning when keypath is unknown |
| \`memstate_remember\` | Save markdown summaries, decisions, task results — **PREFERRED** |
| \`memstate_set\` | Set one specific keypath to a short value only |
| \`memstate_history\` | View how a fact changed over time |
| \`memstate_delete\` | Soft-delete a keypath (history preserved) |

### memstate_get

\`\`\`
memstate_get(project_id="my_app")                      # full project tree
memstate_get(project_id="my_app", keypath="auth")      # subtree
memstate_get(project_id="my_app", keypath="auth", at_revision=5) # time-travel
\`\`\`

### memstate_search

\`\`\`
memstate_search(query="authentication setup", project_id="my_app")
memstate_search(query="database schema", project_id="my_app", limit=10)
\`\`\`

Returns ranked results. Use \`memstate_get(project_id=..., keypath=...)\` to
fetch full content of a specific result if needed.

### memstate_remember (Preferred for saving)

\`\`\`
memstate_remember(
  project_id="my_app",
  content="## Auth Refactor\\n- Switched from JWT to session cookies\\n- Added MFA via TOTP\\n- Updated /api/auth/* endpoints",
  source="agent"
)
\`\`\`

The server uses custom-trained AI models to extract keypaths, detect conflicts,
and version information automatically. This is superior to \`memstate_set\` for
any content longer than a single value.

### memstate_set (Single facts only)

\`\`\`
memstate_set(project_id="my_app", keypath="database.engine", value="PostgreSQL")
memstate_set(project_id="my_app", keypath="api.port", value="8080", category="config")
\`\`\`

Valid categories: \`decision\`, \`preference\`, \`fact\`, \`task\`, \`context\`,
\`requirement\`, \`note\`, \`code\`, \`learning\`.

### memstate_history

\`\`\`
memstate_history(project_id="my_app", keypath="auth.provider")
\`\`\`

## Keypath Conventions

- Use dots for hierarchy: \`auth.provider\`, \`database.engine\`, \`api.pagination.style\`
- Lowercase only, no spaces
- Be specific: prefer \`auth.provider\` over \`auth\`
- Keypaths are auto-prefixed — \`keypath="database"\` with \`project_id="my_app"\` becomes \`project.my_app.database\`

## Conflict Resolution

Memstate handles versioning automatically:
- **Additive**: New information stored without superseding existing
- **Supersede**: New value replaces outdated information; old version preserved in history
- **Contradiction**: Both versions stored; newer version takes precedence automatically

You never need to manually manage versions or flag items for review.
`;
