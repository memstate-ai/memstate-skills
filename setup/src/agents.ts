import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

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

  // Claude Desktop config path varies by OS
  const claudeDesktopConfig = isMac
    ? path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    : isWin
    ? path.join(home, "AppData", "Roaming", "Claude", "claude_desktop_config.json")
    : path.join(home, ".config", "Claude", "claude_desktop_config.json");

  return [
    // ── Claude Code ──────────────────────────────────────────────────────────
    {
      id: "claude-code",
      name: "Claude Code",
      detected: fs.existsSync(path.join(home, ".claude")),
      skillPath: path.join(root, ".claude", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(home, ".claude", "claude_desktop_config.json"),
      mcpConfigLabel: "~/.claude/claude_desktop_config.json",
      instructionPath: path.join(root, "CLAUDE.md"),
      instructionLabel: "CLAUDE.md",
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
      instructionPath: path.join(root, ".cursor", "rules", "memstate-ai.mdc"),
      instructionLabel: ".cursor/rules/memstate-ai.mdc",
    },
    // ── Cline ────────────────────────────────────────────────────────────────
    {
      id: "cline",
      name: "Cline (VS Code)",
      detected: fs.existsSync(path.join(root, ".clinerules")),
      skillPath: path.join(root, ".clinerules", "memstate-ai.md"),
      mcpConfigPath: path.join(home, ".vscode", "cline_mcp_settings.json"),
      mcpConfigLabel: "~/.vscode/cline_mcp_settings.json",
      instructionPath: path.join(root, ".clinerules", "memstate-ai.md"),
      instructionLabel: ".clinerules/memstate-ai.md",
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
      instructionPath: path.join(root, ".windsurf", "rules", "memstate-ai.md"),
      instructionLabel: ".windsurf/rules/memstate-ai.md",
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
      instructionPath: path.join(root, ".kilocode", "rules", "memstate-ai.md"),
      instructionLabel: ".kilocode/rules/memstate-ai.md",
    },
    // ── Claude Desktop ───────────────────────────────────────────────────────
    {
      id: "claude-desktop",
      name: "Claude Desktop",
      detected: fs.existsSync(claudeDesktopConfig),
      skillPath: path.join(home, ".claude", "skills", "memstate-ai", "SKILL.md"),
      mcpConfigPath: claudeDesktopConfig,
      mcpConfigLabel: claudeDesktopConfig.replace(home, "~"),
      isGlobal: true,
    },
    // ── Generic / Other ──────────────────────────────────────────────────────
    {
      id: "other",
      name: "Other / Custom path",
      detected: false,
      skillPath: path.join(root, "memstate-ai", "SKILL.md"),
      mcpConfigPath: path.join(root, "mcp.json"),
      mcpConfigLabel: "mcp.json",
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
 * Write or update an MCP config file to include the memstate server.
 * Handles both `{ mcpServers: {...} }` and `{ servers: {...} }` shapes.
 * Returns { success, message, created }
 */
export function writeMcpConfig(
  configPath: string,
  apiKey: string
): { success: boolean; message: string; created: boolean } {
  try {
    const dir = path.dirname(configPath);
    fs.mkdirSync(dir, { recursive: true });

    let config: Record<string, unknown> = {};
    let created = false;

    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch {
        // Malformed JSON — start fresh but keep a backup
        fs.copyFileSync(configPath, configPath + ".bak");
      }
    } else {
      created = true;
    }

    // Support both common MCP config shapes
    const key = "mcpServers" in config ? "mcpServers" : "mcpServers";
    if (!config[key] || typeof config[key] !== "object") {
      config[key] = {};
    }
    (config[key] as Record<string, unknown>)["memstate"] = mcpServerStanza(apiKey);

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
    return { success: true, message: created ? "Created" : "Updated", created };
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
    fs.writeFileSync(skillPath, content, "utf-8");
    return { success: true, message: "Installed" };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Append the Memstate workflow block to an agent instruction file */
export function appendInstructionBlock(
  filePath: string,
  projectId: string
): { success: boolean; message: string } {
  const MARKER = "<!-- memstate-ai -->";
  const block = `\n${MARKER}\n## Memory (Memstate AI)\n\nThis project uses [Memstate AI](https://memstate.ai) for persistent, versioned memory.\n\n### Before each task\n\`\`\`\nmemstate_get(project_id="${projectId}")\n\`\`\`\n\n### After each task\n\`\`\`\nmemstate_remember(\n  project_id="${projectId}",\n  content="## Task Summary\\n- What was done\\n- Key decisions\\n- Files modified",\n  source="agent"\n)\n\`\`\`\n`;

  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, "utf-8");
      if (existing.includes(MARKER)) {
        return { success: true, message: "Already present" };
      }
      fs.appendFileSync(filePath, block, "utf-8");
      return { success: true, message: "Appended" };
    } else {
      fs.writeFileSync(filePath, block.trimStart(), "utf-8");
      return { success: true, message: "Created" };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
