/**
 * install.ts — Install Memstate skill files only (no instruction file updates)
 *
 * Targets:
 *   - .claude/skills/memstate/SKILL.md         (Claude Code project-level)
 *   - ~/.claude/skills/memstate/SKILL.md        (Claude Code global)
 *   - .kilocode/skills/memstate/SKILL.md        (Kilo Code project-level)
 *   - ~/.kilocode/skills/memstate/SKILL.md      (Kilo Code global)
 *   - .clinerules/memstate.md                   (Cline)
 *   - .cursor/rules/memstate.mdc                (Cursor project-level)
 *   - ~/.cursor/rules/memstate.mdc              (Cursor global)
 *   - .windsurf/rules/memstate.md               (Windsurf)
 *
 * For full setup including instruction file updates, use: npx @memstate/skills setup
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { SKILL_MD_CONTENT } from "./skill-content.js";

interface InstallTarget {
  id: string;
  name: string;
  filePath: string;
  isGlobal?: boolean;
}

function getInstallTargets(cwd: string): InstallTarget[] {
  const home = os.homedir();
  return [
    // ── Claude Code ────────────────────────────────────────────────────────
    {
      id: "claude-project",
      name: "Claude Code (project-level)",
      filePath: path.join(cwd, ".claude", "skills", "memstate", "SKILL.md"),
    },
    {
      id: "claude-global",
      name: "Claude Code (global — all projects on this machine)",
      filePath: path.join(home, ".claude", "skills", "memstate", "SKILL.md"),
      isGlobal: true,
    },
    // ── Kilo Code ─────────────────────────────────────────────────────────
    {
      id: "kilo-project",
      name: "Kilo Code (project-level)",
      filePath: path.join(cwd, ".kilocode", "skills", "memstate", "SKILL.md"),
    },
    {
      id: "kilo-global",
      name: "Kilo Code (global — all projects on this machine)",
      filePath: path.join(home, ".kilocode", "skills", "memstate", "SKILL.md"),
      isGlobal: true,
    },
    // ── Cline ─────────────────────────────────────────────────────────────
    {
      id: "cline",
      name: "Cline",
      filePath: path.join(cwd, ".clinerules", "memstate.md"),
    },
    // ── Cursor ────────────────────────────────────────────────────────────
    {
      id: "cursor-project",
      name: "Cursor (project-level)",
      filePath: path.join(cwd, ".cursor", "rules", "memstate.mdc"),
    },
    {
      id: "cursor-global",
      name: "Cursor (global — all projects on this machine)",
      filePath: path.join(home, ".cursor", "rules", "memstate.mdc"),
      isGlobal: true,
    },
    // ── Windsurf ──────────────────────────────────────────────────────────
    {
      id: "windsurf",
      name: "Windsurf",
      filePath: path.join(cwd, ".windsurf", "rules", "memstate.md"),
    },
  ];
}

function promptUser(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function installFile(filePath: string, content: string): { success: boolean; message: string } {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
    return { success: true, message: "✅ Installed" };
  } catch (err) {
    return {
      success: false,
      message: `❌ Failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const cwd = process.cwd();

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║     Memstate AI Skills — Install             ║");
  console.log("╚══════════════════════════════════════════════╝\n");
  console.log(`Current directory: ${cwd}\n`);
  console.log("Select where to install the Memstate skill:\n");
  console.log("  (For full setup including agent instruction files, run: npx @memstate/skills setup)\n");

  const targets = getInstallTargets(cwd);

  targets.forEach((t, i) => {
    const exists = fs.existsSync(t.filePath);
    const scope = t.isGlobal ? " [global]" : " [project]";
    const overwrite = exists ? " (will overwrite)" : "";
    const displayPath = t.filePath.replace(os.homedir(), "~");
    console.log(`  ${i + 1}. ${t.name}${scope}${overwrite}`);
    console.log(`     → ${displayPath}`);
  });

  console.log(`\n  ${targets.length + 1}. All of the above`);
  console.log(`  ${targets.length + 2}. Cancel\n`);

  const answer = await promptUser(rl, "Enter number(s) separated by commas (e.g. 1,3): ");
  const trimmed = answer.trim();

  if (!trimmed || trimmed === String(targets.length + 2)) {
    console.log("\nCancelled.");
    rl.close();
    return;
  }

  let selectedTargets: InstallTarget[] = [];

  if (trimmed === String(targets.length + 1)) {
    selectedTargets = targets;
  } else {
    const indices = trimmed.split(",").map((s) => parseInt(s.trim(), 10) - 1);
    selectedTargets = indices
      .filter((i) => i >= 0 && i < targets.length)
      .map((i) => targets[i]);
  }

  if (selectedTargets.length === 0) {
    console.log("\nNo valid selection. Cancelled.");
    rl.close();
    return;
  }

  console.log("\nInstalling...\n");

  for (const target of selectedTargets) {
    const displayPath = target.filePath.replace(os.homedir(), "~");
    process.stdout.write(`  ${target.name}... `);
    const result = installFile(target.filePath, SKILL_MD_CONTENT);
    console.log(result.message);
    if (result.success) {
      console.log(`     → ${displayPath}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ Skill installed!\n");
  console.log("Next steps:");
  console.log("  1. Configure the Memstate MCP server:");
  console.log("     npx @memstate/mcp setup");
  console.log("  2. Restart your AI agent");
  console.log("  3. The skill will activate automatically when relevant\n");
  console.log("Docs: https://memstate.ai/docs/skills\n");

  rl.close();
}

// Allow direct execution
if (
  process.argv[1] &&
  (process.argv[1].endsWith("install.js") || process.argv[1].endsWith("install.ts"))
) {
  main().catch((err) => {
    console.error(`\nInstall failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
