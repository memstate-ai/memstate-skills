/**
 * install.ts — Install Memstate skill files into the current project or user home
 *
 * Targets:
 *   - .claude/skills/memstate/SKILL.md    (Claude Code project-level)
 *   - ~/.claude/skills/memstate/SKILL.md  (Claude Code personal)
 *   - .clinerules/memstate.md             (Cline)
 *   - .cursor/rules/memstate.mdc          (Cursor)
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
import { SKILL_MD_CONTENT } from "./skill-content.js";

interface InstallTarget {
  id: string;
  name: string;
  description: string;
  filePath: string;
  content: string;
  isPersonal?: boolean;
}

function getInstallTargets(cwd: string): InstallTarget[] {
  const home = os.homedir();
  return [
    {
      id: "claude-project",
      name: "Claude Code (project)",
      description: "Installs to .claude/skills/memstate/SKILL.md in current directory",
      filePath: path.join(cwd, ".claude", "skills", "memstate", "SKILL.md"),
      content: SKILL_MD_CONTENT,
    },
    {
      id: "claude-personal",
      name: "Claude Code (personal — all projects)",
      description: `Installs to ~/.claude/skills/memstate/SKILL.md`,
      filePath: path.join(home, ".claude", "skills", "memstate", "SKILL.md"),
      content: SKILL_MD_CONTENT,
      isPersonal: true,
    },
    {
      id: "cline",
      name: "Cline",
      description: "Installs to .clinerules/memstate.md in current directory",
      filePath: path.join(cwd, ".clinerules", "memstate.md"),
      content: SKILL_MD_CONTENT,
    },
    {
      id: "cursor",
      name: "Cursor",
      description: "Installs to .cursor/rules/memstate.mdc in current directory",
      filePath: path.join(cwd, ".cursor", "rules", "memstate.mdc"),
      content: SKILL_MD_CONTENT,
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
    return { success: true, message: `✅ Installed` };
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
  console.log(`Installing to: ${cwd}\n`);

  const targets = getInstallTargets(cwd);

  console.log("Select where to install the Memstate skill:\n");
  targets.forEach((t, i) => {
    const exists = fs.existsSync(t.filePath);
    console.log(`  ${i + 1}. ${t.name}${exists ? " (will overwrite)" : ""}`);
    console.log(`     ${t.description}`);
  });
  console.log(`  ${targets.length + 1}. All of the above`);
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
    process.stdout.write(`  ${target.name}... `);
    const result = installFile(target.filePath, target.content);
    console.log(`${result.message}`);
    if (result.success) {
      console.log(`     → ${target.filePath}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ Skill installed!\n");
  console.log("Next steps:");
  console.log("  1. Make sure the Memstate MCP server is configured:");
  console.log("     npx @memstate/mcp setup");
  console.log("  2. Restart your AI agent");
  console.log("  3. The skill will activate automatically when relevant\n");
  console.log("Docs: https://memstate.ai/docs/skills\n");

  rl.close();
}

// Allow direct execution
if (process.argv[1] && (process.argv[1].endsWith("install.js") || process.argv[1].endsWith("install.ts"))) {
  main().catch((err) => {
    console.error(`\nInstall failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
}
