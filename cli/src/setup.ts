/**
 * setup.ts — Full interactive setup: install skill + update agent instruction files
 *
 * This command:
 * 1. Detects the project ID (from git remote or prompts user)
 * 2. Installs the skill to the appropriate location(s)
 * 3. Updates AGENTS.md, CLAUDE.md, GEMINI.md, and/or .clinerules with pre/post task instructions
 * 4. Provides next steps for MCP configuration
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { execSync } from "child_process";
import {
  SKILL_MD_CONTENT,
  generateAgentInstructions,
  generateClineRules,
  generateCursorRules,
} from "./skill-content.js";

const MEMSTATE_DOCS_URL = "https://memstate.ai/docs/skills";
const MEMSTATE_SETUP_URL = "https://memstate.ai/docs/mcp/setup";

// ─── Agent detection ─────────────────────────────────────────────────────────

interface AgentInfo {
  id: string;
  name: string;
  detected: boolean;
  skillPath: string;
  instructionFile?: string;
  instructionPath?: string;
}

function detectGitRepoName(cwd: string): string | null {
  try {
    const remote = execSync("git remote get-url origin", { cwd, stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim();
    // Extract repo name from SSH or HTTPS remote URL
    const match = remote.match(/[/:]([^/]+?)(?:\.git)?$/);
    return match ? match[1].toLowerCase().replace(/[^a-z0-9-]/g, "-") : null;
  } catch {
    return null;
  }
}

function detectAgents(cwd: string): AgentInfo[] {
  const home = os.homedir();

  const agents: AgentInfo[] = [
    {
      id: "claude-code-project",
      name: "Claude Code (project-level skill)",
      detected: fs.existsSync(path.join(cwd, ".claude")) || fs.existsSync(path.join(home, ".claude")),
      skillPath: path.join(cwd, ".claude", "skills", "memstate", "SKILL.md"),
      instructionFile: "CLAUDE.md",
      instructionPath: path.join(cwd, "CLAUDE.md"),
    },
    {
      id: "claude-code-personal",
      name: "Claude Code (personal — all projects)",
      detected: fs.existsSync(path.join(home, ".claude")),
      skillPath: path.join(home, ".claude", "skills", "memstate", "SKILL.md"),
    },
    {
      id: "cline",
      name: "Cline (VS Code)",
      detected:
        fs.existsSync(path.join(cwd, ".clinerules")) ||
        fs.existsSync(path.join(home, "Documents", "Cline", "Rules")),
      skillPath: path.join(cwd, ".clinerules", "memstate.md"),
      instructionFile: ".clinerules/memstate.md",
      instructionPath: path.join(cwd, ".clinerules", "memstate.md"),
    },
    {
      id: "cursor",
      name: "Cursor",
      detected:
        fs.existsSync(path.join(cwd, ".cursor")) ||
        fs.existsSync(path.join(home, ".cursor")),
      skillPath: path.join(cwd, ".cursor", "rules", "memstate.mdc"),
      instructionFile: ".cursor/rules/memstate.mdc",
      instructionPath: path.join(cwd, ".cursor", "rules", "memstate.mdc"),
    },
    {
      id: "agents-md",
      name: "AGENTS.md (universal — OpenAI Codex, Gemini, Amp, Jules, etc.)",
      detected: fs.existsSync(path.join(cwd, "AGENTS.md")) || fs.existsSync(path.join(cwd, ".git")),
      skillPath: path.join(cwd, ".claude", "skills", "memstate", "SKILL.md"),
      instructionFile: "AGENTS.md",
      instructionPath: path.join(cwd, "AGENTS.md"),
    },
    {
      id: "gemini",
      name: "Gemini CLI",
      detected: fs.existsSync(path.join(cwd, "GEMINI.md")) || fs.existsSync(path.join(home, ".gemini")),
      skillPath: path.join(cwd, ".claude", "skills", "memstate", "SKILL.md"),
      instructionFile: "GEMINI.md",
      instructionPath: path.join(cwd, "GEMINI.md"),
    },
  ];

  return agents;
}

// ─── File operations ──────────────────────────────────────────────────────────

function installSkillFile(skillPath: string): { success: boolean; message: string } {
  try {
    const dir = path.dirname(skillPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(skillPath, SKILL_MD_CONTENT, "utf-8");
    return { success: true, message: "✅ Installed" };
  } catch (err) {
    return {
      success: false,
      message: `❌ Failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function updateInstructionFile(
  filePath: string,
  projectId: string,
  agentId: string
): { success: boolean; message: string } {
  try {
    const dir = path.dirname(filePath);
    if (dir !== ".") fs.mkdirSync(dir, { recursive: true });

    let content: string;

    if (agentId === "cline") {
      // Cline uses its own rules format
      content = generateClineRules(projectId);
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true, message: "✅ Created" };
    }

    if (agentId === "cursor") {
      // Cursor uses MDC format
      content = generateCursorRules(projectId);
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true, message: "✅ Created" };
    }

    // For AGENTS.md, CLAUDE.md, GEMINI.md — append or create
    const instructions = generateAgentInstructions(projectId);
    const MEMSTATE_MARKER = "## Memory (Memstate AI)";

    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, "utf-8");
      if (existing.includes(MEMSTATE_MARKER)) {
        // Replace existing Memstate section
        const before = existing.substring(0, existing.indexOf(MEMSTATE_MARKER));
        // Find the next top-level section after the Memstate block, or end of file
        const afterStart = existing.indexOf(MEMSTATE_MARKER) + MEMSTATE_MARKER.length;
        const nextSection = existing.indexOf("\n## ", afterStart);
        const after = nextSection !== -1 ? existing.substring(nextSection) : "";
        fs.writeFileSync(filePath, before + instructions + after, "utf-8");
        return { success: true, message: "✅ Updated (replaced existing Memstate section)" };
      } else {
        // Append to existing file
        fs.appendFileSync(filePath, "\n" + instructions, "utf-8");
        return { success: true, message: "✅ Updated (appended to existing file)" };
      }
    } else {
      // Create new file
      const header =
        agentId === "agents-md"
          ? "# Agent Instructions\n\n"
          : agentId === "claude-code-project"
          ? "# Claude Instructions\n\n"
          : "# Gemini Instructions\n\n";
      fs.writeFileSync(filePath, header + instructions, "utf-8");
      return { success: true, message: "✅ Created" };
    }
  } catch (err) {
    return {
      success: false,
      message: `❌ Failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function promptUser(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function openBrowser(url: string): void {
  const { exec } = require("child_process");
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? `open "${url}"`
      : platform === "win32"
      ? `start "" "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const cwd = process.cwd();

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║     Memstate AI Skills — Setup               ║");
  console.log("║     Persistent memory for AI agents          ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── Step 1: Determine project ID ──────────────────────────────────────────

  console.log("Step 1: Project ID");
  console.log("──────────────────");

  const detectedRepoName = detectGitRepoName(cwd);
  let projectId: string;

  if (detectedRepoName) {
    console.log(`Detected git repo: ${detectedRepoName}`);
    const confirm = await promptUser(
      rl,
      `Use "${detectedRepoName}" as the project ID? (y/n or enter a different name): `
    );
    if (confirm.toLowerCase() === "y" || confirm.trim() === "") {
      projectId = detectedRepoName;
    } else if (confirm.toLowerCase() !== "n") {
      projectId = confirm.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || detectedRepoName;
    } else {
      const custom = await promptUser(rl, "Enter project ID (e.g. 'my-app'): ");
      projectId = custom.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "myproject";
    }
  } else {
    console.log(
      "No git remote detected. Enter a short project ID (e.g. the repo name or topic)."
    );
    const custom = await promptUser(rl, "Project ID: ");
    projectId = custom.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-") || "myproject";
  }

  console.log(`\nUsing project ID: "${projectId}"\n`);

  // ── Step 2: Detect and select agents ──────────────────────────────────────

  console.log("Step 2: Select where to install");
  console.log("────────────────────────────────");

  const allAgents = detectAgents(cwd);
  const detectedAgents = allAgents.filter((a) => a.detected);
  const undetectedAgents = allAgents.filter((a) => !a.detected);

  if (detectedAgents.length > 0) {
    console.log("Detected agents/tools:\n");
    detectedAgents.forEach((a, i) => {
      console.log(`  ${i + 1}. ${a.name}`);
    });
  }

  if (undetectedAgents.length > 0) {
    console.log("\nOther available targets:\n");
    undetectedAgents.forEach((a, i) => {
      console.log(`  ${detectedAgents.length + i + 1}. ${a.name}`);
    });
  }

  const totalCount = allAgents.length;
  console.log(`  ${totalCount + 1}. All of the above`);
  console.log(`  ${totalCount + 2}. Cancel\n`);

  const selection = await promptUser(
    rl,
    "Enter number(s) to install (e.g. 1,3 or press Enter for detected only): "
  );
  const trimmedSelection = selection.trim();

  let selectedAgents: AgentInfo[] = [];

  if (trimmedSelection === "" && detectedAgents.length > 0) {
    selectedAgents = detectedAgents;
  } else if (trimmedSelection === String(totalCount + 1)) {
    selectedAgents = allAgents;
  } else if (trimmedSelection === String(totalCount + 2) || trimmedSelection === "n") {
    console.log("\nCancelled.");
    rl.close();
    return;
  } else {
    const indices = trimmedSelection.split(",").map((s) => parseInt(s.trim(), 10) - 1);
    selectedAgents = indices
      .filter((i) => i >= 0 && i < allAgents.length)
      .map((i) => allAgents[i]);
  }

  if (selectedAgents.length === 0) {
    console.log("\nNo valid selection. Cancelled.");
    rl.close();
    return;
  }

  // ── Step 3: Install skill files ───────────────────────────────────────────

  console.log("\nStep 3: Installing skill files");
  console.log("───────────────────────────────");

  // Deduplicate skill paths (multiple agents may share the same skill location)
  const installedSkillPaths = new Set<string>();
  const skillInstallResults: { agent: string; path: string; result: { success: boolean; message: string } }[] = [];

  for (const agent of selectedAgents) {
    if (!installedSkillPaths.has(agent.skillPath)) {
      installedSkillPaths.add(agent.skillPath);
      process.stdout.write(`  ${agent.name} skill... `);
      const result = installSkillFile(agent.skillPath);
      console.log(result.message);
      if (result.success) {
        console.log(`     → ${agent.skillPath}`);
      }
      skillInstallResults.push({ agent: agent.name, path: agent.skillPath, result });
    }
  }

  // ── Step 4: Update instruction files ─────────────────────────────────────

  console.log("\nStep 4: Updating agent instruction files");
  console.log("─────────────────────────────────────────");
  console.log("These files tell your agent when to use Memstate (before/after tasks).\n");

  const agentsWithInstructions = selectedAgents.filter((a) => a.instructionPath);

  if (agentsWithInstructions.length === 0) {
    console.log("  No instruction files to update for selected targets.\n");
  } else {
    for (const agent of agentsWithInstructions) {
      if (!agent.instructionPath || !agent.instructionFile) continue;
      const exists = fs.existsSync(agent.instructionPath);
      process.stdout.write(
        `  ${agent.instructionFile} (${exists ? "update" : "create"})... `
      );
      const result = updateInstructionFile(agent.instructionPath, projectId, agent.id);
      console.log(result.message);
      if (result.success) {
        console.log(`     → ${agent.instructionPath}`);
      }
    }
  }

  // ── Step 5: MCP check ─────────────────────────────────────────────────────

  console.log("\nStep 5: Memstate MCP Server");
  console.log("────────────────────────────");

  const hasMcpConfig =
    fs.existsSync(path.join(cwd, ".cursor", "mcp.json")) ||
    fs.existsSync(path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json")) ||
    fs.existsSync(path.join(os.homedir(), ".codeium", "windsurf", "mcp_config.json"));

  if (hasMcpConfig) {
    console.log("  MCP config detected. Make sure Memstate is added to it.");
  } else {
    console.log("  No MCP config detected.");
  }

  console.log("\n  To configure the Memstate MCP server, run:");
  console.log("    npx @memstate/mcp setup\n");
  console.log("  Or add manually to your MCP config:");
  console.log(`
  {
    "mcpServers": {
      "memstate": {
        "command": "npx",
        "args": ["-y", "@memstate/mcp"],
        "env": { "MEMSTATE_API_KEY": "YOUR_API_KEY_HERE" }
      }
    }
  }
`);

  const openDocs = await promptUser(rl, "Open the MCP setup guide in your browser? (y/n): ");
  if (openDocs.toLowerCase() === "y") {
    openBrowser(MEMSTATE_SETUP_URL);
    console.log(`  Opening ${MEMSTATE_SETUP_URL}...`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ Setup complete!\n");
  console.log(`Project ID: "${projectId}"\n`);
  console.log("Your AI agents will now:");
  console.log(`  • Check memory before tasks: memstate_get(project_id="${projectId}")`);
  console.log("  • Save summaries after tasks automatically");
  console.log("  • Never re-explain your architecture\n");
  console.log("Next steps:");
  console.log("  1. Run: npx @memstate/mcp setup  (configure MCP server)");
  console.log("  2. Restart your AI agent(s)");
  console.log("  3. Commit the new files to share setup with your team\n");
  console.log(`Docs:      ${MEMSTATE_DOCS_URL}`);
  console.log("Dashboard: https://memstate.ai/dashboard\n");

  rl.close();
}

// Allow direct execution
if (
  process.argv[1] &&
  (process.argv[1].endsWith("setup.js") || process.argv[1].endsWith("setup.ts"))
) {
  main().catch((err) => {
    console.error(`\nSetup failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
