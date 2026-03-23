/**
 * Memstate AI skill content — embedded so the CLI works without file system access to the repo.
 * This mirrors memstate/SKILL.md in the repository root.
 */

export const SKILL_MD_CONTENT = `---
name: memstate
description: >
  Persistent, versioned memory for AI agents using Memstate AI. Use this skill
  to store and retrieve structured knowledge across tasks and sessions. Invoke
  BEFORE every task to fetch existing context and AFTER every task to save
  summaries. Works with any project — use the GitHub repo name or a short
  descriptive name as the project_id.
---

# Memstate AI — Persistent Agent Memory

Memstate AI gives you structured, versioned memory that persists across sessions.
Use it to avoid repeating work, preserve architectural decisions, and maintain
project context automatically.

## Project ID

The **project_id** is the key that namespaces all memories. Use:
- The **GitHub repository name** (e.g., \`my-app\`, \`memstate-mcp\`)
- Or any short, descriptive topic name (e.g., \`frontend-redesign\`, \`q2-planning\`)

Keep it lowercase with hyphens. All keypaths are automatically prefixed with
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

Save a markdown summary of what was done:

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
memstate_get(project_id="myapp")                      # full project tree
memstate_get(project_id="myapp", keypath="auth")      # subtree
memstate_get(memory_id="mem_abc123")                  # single memory by ID
\`\`\`

### memstate_search

\`\`\`
memstate_search(query="authentication setup", project_id="myapp")
memstate_search(query="database schema", project_id="myapp", limit=10)
\`\`\`

Returns ranked results with \`memory_id\`. Use \`memstate_get(memory_id=...)\` to
fetch full content of a result.

### memstate_remember (Preferred for saving)

\`\`\`
memstate_remember(
  project_id="myapp",
  content="## Auth Refactor\\n- Switched from JWT to session cookies\\n- Added MFA via TOTP\\n- Updated /api/auth/* endpoints",
  source="agent"
)
\`\`\`

The server uses custom-trained AI models to extract keypaths, detect conflicts,
and version information automatically. This is superior to \`memstate_set\` for
any content longer than a single value.

### memstate_set (Single facts only)

\`\`\`
memstate_set(project_id="myapp", keypath="database.engine", value="PostgreSQL")
memstate_set(project_id="myapp", keypath="api.port", value="8080", category="config")
\`\`\`

Valid categories: \`decision\`, \`preference\`, \`fact\`, \`task\`, \`context\`,
\`requirement\`, \`note\`, \`code\`, \`learning\`.

### memstate_history

\`\`\`
memstate_history(project_id="myapp", keypath="auth.provider")
memstate_history(memory_id="mem_abc123")
\`\`\`

## Keypath Conventions

- Use dots for hierarchy: \`auth.provider\`, \`database.engine\`, \`api.pagination.style\`
- Lowercase only, no spaces
- Be specific: prefer \`auth.provider\` over \`auth\`
- Keypaths are auto-prefixed — \`keypath="database"\` with \`project_id="myapp"\` becomes \`project.myapp.database\`

## Conflict Resolution

Memstate handles versioning automatically:
- **Additive**: New information stored without superseding existing
- **Supersede**: New value replaces outdated information; old version preserved in history
- **Contradiction**: Both versions stored; newer version takes precedence automatically

You never need to manually manage versions or flag items for review.
`;

/**
 * Generate the AGENTS.md / CLAUDE.md / GEMINI.md instructions block for a specific project.
 * This is a concise version suitable for appending to existing files.
 */
export function generateAgentInstructions(projectId: string): string {
  return `
## Memory (Memstate AI)

This project uses [Memstate AI](https://memstate.ai) for persistent, versioned memory.

### Before each task
Check what already exists to avoid duplicate work:
\`\`\`
memstate_get(project_id="${projectId}")
\`\`\`
Or search by topic:
\`\`\`
memstate_search(query="<topic>", project_id="${projectId}")
\`\`\`

### After each task
Save a markdown summary:
\`\`\`
memstate_remember(
  project_id="${projectId}",
  content="## Task Summary\\n- What was done\\n- Key decisions made\\n- Files modified\\n- Next steps",
  source="agent"
)
\`\`\`

### Tool guide
- \`memstate_remember\` — markdown summaries, decisions, task results (**preferred**)
- \`memstate_set\` — single short values only (config flags, status)
- \`memstate_get\` — browse/retrieve before tasks
- \`memstate_search\` — semantic lookup when keypath unknown
- \`memstate_history\` — audit how knowledge evolved
`.trimStart();
}

/**
 * Generate Cline rules content for .clinerules/memstate.md
 */
export function generateClineRules(projectId: string): string {
  return `# Memstate Memory Rules

## Before each task
- Run \`memstate_get(project_id="${projectId}")\` to load existing context
- Search for relevant memories: \`memstate_search(query="<topic>", project_id="${projectId}")\`

## After each task
- Save a summary: \`memstate_remember(project_id="${projectId}", content="## Summary\\n...", source="agent")\`

## Key principles
- Always check memory before starting — never re-explain what's already stored
- Prefer \`memstate_remember\` for summaries, \`memstate_set\` only for single key=value facts
- Use short project IDs (e.g. "${projectId}" not "my-full-application-name")
`;
}

/**
 * Generate Cursor MDC rules content for .cursor/rules/memstate.mdc
 */
export function generateCursorRules(projectId: string): string {
  return `---
description: Memstate AI memory — use before and after every task
globs: ["**/*"]
alwaysApply: true
---

# Memstate AI Memory

## Before each task
Check existing project knowledge:
\`memstate_get(project_id="${projectId}")\`

## After each task
Save a summary:
\`memstate_remember(project_id="${projectId}", content="## Summary\\n...", source="agent")\`

## Tools
- \`memstate_remember\` — preferred for summaries and decisions
- \`memstate_set\` — single key=value facts only
- \`memstate_get\` — browse before tasks
- \`memstate_search\` — find by meaning
`;
}
