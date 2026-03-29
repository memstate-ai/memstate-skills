import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

/** Canonical instruction content URL — single source of truth */
export const INSTRUCTIONS_URL = "https://memstate.ai/files/use-memstate-memory.md";

/** Version embedded in instruction blocks — bump when format changes */
export const INSTRUCTION_VERSION = "v2";

export interface Agent {
  id: string;
  name: string;
  /** Whether this agent environment was detected on the machine */
  detected: boolean;
  /** Absolute path to write the SKILL.md */
  skillPath: string;
  /** Absolute path to the MCP config JSON file */
  mcpConfigPath: string;
  /** Human-readable name of the MCP config file */
  mcpConfigLabel: string;
  /** JSON key for MCP servers — "mcpServers" or "servers" */
  mcpKey: "mcpServers" | "servers";
  /** Absolute path to the agent instruction file (CLAUDE.md, .clinerules, etc.) */
  instructionPath?: string;
  /** Display label for the instruction file */
  instructionLabel?: string;
  /** True if this is a global (user-level) install */
  isGlobal?: boolean;
}

export function getAgents(root: string): Agent[] {
  const home = os.homedir();
  const isMac = process.platform === "darwin";
  const isWin = process.platform === "win32";

  const claudeDesktopConfig = isMac
    ? path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    : isWin
    ? path.join(home, "AppData", "Roaming", "Claude", "claude_desktop_config.json")
    : path.join(home, ".config", "Claude", "claude_desktop_config.json");

  // Cline stores MCP settings deep in VS Code extension storage
  const clineConfigPath = isMac
    ? path.join(home, "Library", "Application Support", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
    : isWin
    ? path.join(home, "AppData", "Roaming", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
    : path.join(home, ".config", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json");

  // VS Code global MCP config (used by Copilot, Roo Code, etc.)
  const vscodeGlobalMcp = isMac
    ? path.join(home, "Library", "Application Support", "Code", "User", "mcp.json")
    : isWin
    ? path.join(home, "AppData", "Roaming", "Code", "User", "mcp.json")
    : path.join(home, ".config", "Code", "User", "mcp.json");

  return [
    // ── Claude Code ──────────────────────────────────────────────────────────
    {
      id: "claude-code",
      name: "Claude Code",
      detected: fs.existsSync(path.join(home, ".claude")),
      skillPath: path.join(root, ".claude", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(home, ".claude.json"),
      mcpConfigLabel: "~/.claude.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, "CLAUDE.md"),
      instructionLabel: "CLAUDE.md",
    },
    // ── Claude Desktop ───────────────────────────────────────────────────────
    {
      id: "claude-desktop",
      name: "Claude Desktop",
      detected: fs.existsSync(claudeDesktopConfig) || fs.existsSync(path.dirname(claudeDesktopConfig)),
      skillPath: path.join(home, ".claude", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: claudeDesktopConfig,
      mcpConfigLabel: claudeDesktopConfig.replace(home, "~"),
      mcpKey: "mcpServers",
      isGlobal: true,
    },
    // ── Cursor ───────────────────────────────────────────────────────────────
    {
      id: "cursor",
      name: "Cursor",
      detected:
        fs.existsSync(path.join(root, ".cursor")) ||
        fs.existsSync(path.join(home, ".cursor")),
      skillPath: path.join(root, ".cursor", "rules", "memstate-ai.mdc"),
      mcpConfigPath: path.join(root, ".cursor", "mcp.json"),
      mcpConfigLabel: ".cursor/mcp.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".cursor", "rules", "use-memstate-memory.mdc"),
      instructionLabel: ".cursor/rules/use-memstate-memory.mdc",
    },
    // ── Windsurf ─────────────────────────────────────────────────────────────
    {
      id: "windsurf",
      name: "Windsurf",
      detected:
        fs.existsSync(path.join(root, ".windsurf")) ||
        fs.existsSync(path.join(home, ".codeium", "windsurf")),
      skillPath: path.join(root, ".windsurf", "rules", "memstate-ai.md"),
      mcpConfigPath: path.join(home, ".codeium", "windsurf", "mcp_config.json"),
      mcpConfigLabel: "~/.codeium/windsurf/mcp_config.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".windsurf", "rules", "memstate-ai.md"),
      instructionLabel: ".windsurf/rules/memstate-ai.md",
    },
    // ── Cline ────────────────────────────────────────────────────────────────
    {
      id: "cline",
      name: "Cline (VS Code)",
      detected: fs.existsSync(path.join(root, ".clinerules")) ||
        fs.existsSync(path.dirname(clineConfigPath)),
      skillPath: path.join(root, ".clinerules", "memstate-ai.md"),
      mcpConfigPath: clineConfigPath,
      mcpConfigLabel: clineConfigPath.replace(home, "~"),
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".clinerules", "memstate-ai.md"),
      instructionLabel: ".clinerules/memstate-ai.md",
    },
    // ── Kilo Code ────────────────────────────────────────────────────────────
    {
      id: "kilo",
      name: "Kilo Code",
      detected:
        fs.existsSync(path.join(root, ".kilocode")) ||
        fs.existsSync(path.join(home, ".kilocode")),
      skillPath: path.join(root, ".kilocode", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(root, ".kilocode", "mcp.json"),
      mcpConfigLabel: ".kilocode/mcp.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".kilocode", "rules", "memstate-ai.md"),
      instructionLabel: ".kilocode/rules/memstate-ai.md",
    },
    // ── GitHub Copilot ───────────────────────────────────────────────────────
    {
      id: "copilot",
      name: "GitHub Copilot",
      detected:
        fs.existsSync(path.join(root, ".vscode")) ||
        fs.existsSync(path.join(root, ".github", "copilot-instructions.md")),
      skillPath: path.join(root, ".github", "memstate-ai-skill.md"),
      mcpConfigPath: path.join(root, ".vscode", "mcp.json"),
      mcpConfigLabel: ".vscode/mcp.json",
      mcpKey: "servers",
      instructionPath: path.join(root, ".github", "copilot-instructions.md"),
      instructionLabel: ".github/copilot-instructions.md",
    },
    // ── Gemini CLI ───────────────────────────────────────────────────────────
    {
      id: "gemini",
      name: "Gemini CLI",
      detected: fs.existsSync(path.join(home, ".gemini")),
      skillPath: path.join(root, ".gemini", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(home, ".gemini", "settings.json"),
      mcpConfigLabel: "~/.gemini/settings.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, "GEMINI.md"),
      instructionLabel: "GEMINI.md",
    },
    // ── Roo Code ─────────────────────────────────────────────────────────────
    {
      id: "roo",
      name: "Roo Code",
      detected:
        fs.existsSync(path.join(root, ".roo")) ||
        fs.existsSync(path.join(root, ".roomodes")),
      skillPath: path.join(root, ".roo", "rules", "memstate-ai.md"),
      mcpConfigPath: path.join(root, ".roo", "mcp.json"),
      mcpConfigLabel: ".roo/mcp.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".roo", "rules", "memstate-ai.md"),
      instructionLabel: ".roo/rules/memstate-ai.md",
    },
    // ── Amazon Q Developer ───────────────────────────────────────────────────
    {
      id: "amazon-q",
      name: "Amazon Q Developer",
      detected: fs.existsSync(path.join(home, ".aws", "amazonq")),
      skillPath: path.join(root, ".amazonq", "rules", "memstate-ai.md"),
      mcpConfigPath: path.join(home, ".aws", "amazonq", "mcp.json"),
      mcpConfigLabel: "~/.aws/amazonq/mcp.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".amazonq", "rules", "memstate-ai.md"),
      instructionLabel: ".amazonq/rules/memstate-ai.md",
    },
    // ── Zed ──────────────────────────────────────────────────────────────────
    {
      id: "zed",
      name: "Zed",
      detected: fs.existsSync(path.join(home, ".config", "zed")) ||
        fs.existsSync(path.join(root, ".zed")),
      skillPath: path.join(root, ".zed", "memstate-ai.md"),
      mcpConfigPath: path.join(root, ".zed", "settings.json"),
      mcpConfigLabel: ".zed/settings.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, ".zed", "rules", "memstate-ai.md"),
      instructionLabel: ".zed/rules/memstate-ai.md",
    },
    // ── AGENTS.md (Generic standard) ─────────────────────────────────────────
    {
      id: "agents-md",
      name: "AGENTS.md (Codex / Other)",
      detected: fs.existsSync(path.join(root, "AGENTS.md")),
      skillPath: path.join(root, ".agents", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(root, "mcp.json"),
      mcpConfigLabel: "mcp.json",
      mcpKey: "mcpServers",
      instructionPath: path.join(root, "AGENTS.md"),
      instructionLabel: "AGENTS.md",
    },
    // ── Generic / Other ──────────────────────────────────────────────────────
    {
      id: "other",
      name: "Other / Custom path",
      detected: false,
      skillPath: path.join(root, "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(root, "mcp.json"),
      mcpConfigLabel: "mcp.json",
      mcpKey: "mcpServers",
    },
  ];
}

/** Detect the project ID from the git remote, or return null */
export function detectProjectId(cwd: string): string | null {
  try {
    const remote = execSync("git remote get-url origin", {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    })
      .toString()
      .trim();
    const match = remote.match(/[/:]([^/]+?)(?:\.git)?$/);
    return match ? match[1].toLowerCase().replace(/[^a-z0-9_]/g, "_") : null;
  } catch {
    return null;
  }
}

/** The MCP server stanza to inject */
export function mcpServerStanza(apiKey = "YOUR_API_KEY_HERE"): object {
  return {
    command: "npx",
    args: ["-y", "@memstate/mcp"],
    env: {
      MEMSTATE_API_KEY: apiKey,
    },
  };
}

/**
 * Safely parse JSON with detailed error reporting.
 * Returns the parsed object or null if invalid.
 */
export function safeParseJson(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Write or update an MCP config file to include the memstate server.
 * Handles both `{ mcpServers: {...} }` and `{ servers: {...} }` shapes.
 * Preserves existing servers. Validates JSON output before writing.
 * Returns { success, message, created }
 */
export function writeMcpConfig(
  configPath: string,
  apiKey: string,
  mcpKey: "mcpServers" | "servers" = "mcpServers"
): { success: boolean; message: string; created: boolean } {
  try {
    const dir = path.dirname(configPath);
    fs.mkdirSync(dir, { recursive: true });

    // Resolve symlinks to avoid writing to the wrong file
    let resolvedPath = configPath;
    if (fs.existsSync(configPath)) {
      resolvedPath = fs.realpathSync(configPath);
    }

    let config: Record<string, unknown> = {};
    let created = false;
    let hadExistingMemstate = false;

    if (fs.existsSync(resolvedPath)) {
      const rawContent = fs.readFileSync(resolvedPath, "utf-8").trim();

      if (rawContent === "") {
        // Empty file — treat as new
        created = true;
      } else {
        const parsed = safeParseJson(rawContent);
        if (parsed === null) {
          // Malformed JSON — backup and start fresh
          const backupPath = resolvedPath + ".bak." + Date.now();
          fs.copyFileSync(resolvedPath, backupPath);
          created = true;
        } else {
          config = parsed;
        }
      }
    } else {
      created = true;
    }

    // Detect which key the file already uses
    const existingKey = "servers" in config ? "servers" : "mcpServers" in config ? "mcpServers" : mcpKey;
    const key = existingKey;

    if (!config[key] || typeof config[key] !== "object") {
      config[key] = {};
    }

    const servers = config[key] as Record<string, unknown>;
    hadExistingMemstate = "memstate" in servers;
    servers["memstate"] = mcpServerStanza(apiKey);

    // Validate output JSON before writing
    const output = JSON.stringify(config, null, 2) + "\n";
    const reparse = safeParseJson(output);
    if (reparse === null) {
      return { success: false, message: "Internal error: generated invalid JSON", created: false };
    }

    fs.writeFileSync(resolvedPath, output, "utf-8");

    const message = created ? "Created" : hadExistingMemstate ? "Updated (replaced existing memstate entry)" : "Updated (added memstate)";
    return { success: true, message, created };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      created: false,
    };
  }
}

/** Write the SKILL.md file to the given path */
export function writeSkillFile(
  skillPath: string,
  content: string
): { success: boolean; message: string } {
  try {
    const dir = path.dirname(skillPath);
    fs.mkdirSync(dir, { recursive: true });

    let resolvedPath = skillPath;
    if (fs.existsSync(skillPath)) {
      resolvedPath = fs.realpathSync(skillPath);
    }

    fs.writeFileSync(resolvedPath, content, "utf-8");
    return { success: true, message: "Installed" };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch the latest instructions from the hosted URL.
 * Falls back to the bundled version if network is unavailable.
 */
export async function fetchInstructions(): Promise<string> {
  try {
    const res = await fetch(INSTRUCTIONS_URL, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      if (text.includes("memstate_get")) return text;
    }
  } catch {
    // Network unavailable — use fallback
  }
  return FALLBACK_INSTRUCTIONS;
}

/** Append or update the Memstate instruction block in an agent file */
export function appendInstructionBlock(
  filePath: string,
  projectId: string,
  instructionContent?: string
): { success: boolean; message: string } {
  const BEGIN_MARKER = "<!-- BEGIN MEMSTATE-AI INSTRUCTIONS -->";
  const END_MARKER = "<!-- END MEMSTATE-AI INSTRUCTIONS -->";

  // Build the instruction content, replacing placeholders with actual project ID
  let content = instructionContent || FALLBACK_INSTRUCTIONS;
  content = content
    .replace(/<your_project>/g, projectId)
    .replace(/my_project/g, projectId);

  // For Cursor .mdc files, prepend the frontmatter
  const isMdc = filePath.endsWith(".mdc");
  const mdcFrontmatter = "---\nalwaysApply: true\n---\n\n";

  const block = `${BEGIN_MARKER}\n${content}\n${END_MARKER}`;
  const fullBlock = isMdc ? mdcFrontmatter + block : block;

  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    let resolvedPath = filePath;
    if (fs.existsSync(filePath)) {
      resolvedPath = fs.realpathSync(filePath);
    }

    if (fs.existsSync(resolvedPath)) {
      const existing = fs.readFileSync(resolvedPath, "utf-8");

      // If our markers exist, replace the block (update in place)
      if (existing.includes(BEGIN_MARKER) && existing.includes(END_MARKER)) {
        const regex = new RegExp(
          `${escapeRegex(BEGIN_MARKER)}[\\s\\S]*?${escapeRegex(END_MARKER)}`,
          "g"
        );
        const updated = existing.replace(regex, block);
        if (existing === updated) {
          return { success: true, message: "Already up to date" };
        }
        fs.writeFileSync(resolvedPath, updated, "utf-8");
        return { success: true, message: "Updated to latest instructions" };
      }

      // Handle legacy marker from older versions
      const LEGACY_MARKER = "<!-- memstate-ai -->";
      if (existing.includes(LEGACY_MARKER)) {
        const legacy = existing.replace(LEGACY_MARKER, "");
        fs.writeFileSync(resolvedPath, legacy.trimEnd() + "\n\n" + block + "\n", "utf-8");
        return { success: true, message: "Replaced legacy instructions" };
      }

      // Check for existing memstate content without markers
      if (existing.includes("memstate_get") || existing.includes("Memstate MCP")) {
        // Don't double-add — wrap existing content in markers on next run
        return { success: true, message: "Memstate instructions already present (manual)" };
      }

      // Append to existing file
      fs.appendFileSync(resolvedPath, "\n\n" + block + "\n", "utf-8");
      return { success: true, message: "Appended" };
    } else {
      // Create new file
      fs.writeFileSync(resolvedPath, fullBlock + "\n", "utf-8");
      return { success: true, message: "Created" };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Bundled fallback instructions — used when network is unavailable */
const FALLBACK_INSTRUCTIONS = `# Memstate MCP - Memory Storage

This project uses Memstate MCP for persistent, versioned memory across sessions.

## REQUIRED: Start and end every task with memory

**BEFORE starting any task**, load existing context so you don't redo past work or revert intentional decisions:
\`\`\`
memstate_get(project_id="<your_project>")
\`\`\`

**AFTER completing any task**, save what you did so the next session has context:
\`\`\`
memstate_remember(project_id="<your_project>", content="## Task Summary\\n- What was done\\n- Key decisions made\\n- Files modified", source="agent")
\`\`\`

These two calls are mandatory. Skipping them means the next session starts blind.

## Tool reference

| Tool | When to use |
|------|-------------|
| memstate_get | **Start of every task.** Browse project tree or fetch content at a keypath. |
| memstate_remember | **End of every task.** Save markdown summaries, notes, decisions. |
| memstate_search | Find memories by meaning when you don't know the exact keypath. |
| memstate_set | Store a single key=value fact (e.g. config.port). Not for summaries. |
| memstate_history | View version history of a keypath. |
| memstate_delete | Soft-delete a keypath (history preserved). |

## Project naming
Use a short snake_case name matching your repo or topic (e.g. my_app, api_service). All related memories should share the same project_id.`;
