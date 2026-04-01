import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";
import {
  c,
  LOGO_COMPACT,
  hr,
  step,
  tick,
  cross,
  arrow,
  info,
  hint,
} from "./theme.js";
import { ask, multiSelect, closeReadline } from "./prompt.js";
import {
  getAgents,
  detectProjectId,
  writeMcpConfig,
  writeSkillFile,
  appendInstructionBlock,
  fetchInstructions,
  claudeCliAvailable,
  installViaClaudeCli,
  type Agent,
} from "./agents.js";
import { SKILL_MD_CONTENT } from "./skill-content.js";

export interface SetupOptions {
  /** Install MCP server config (default: true) */
  mcp: boolean;
  /** Install SKILL.md (default: false unless --skill passed) */
  skill: boolean;
  /** Force project-level install */
  project: boolean;
  /** Force global install */
  global: boolean;
  /** Custom project root path */
  rootPath?: string;
  /** Skip all prompts and use defaults */
  yes: boolean;
}

function openBrowser(url: string): void {
  try {
    const cmd =
      process.platform === "darwin"
        ? `open "${url}"`
        : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;
    execSync(cmd, { stdio: "ignore" });
  } catch {
    // Silently ignore — browser open is best-effort
  }
}

function displayPath(p: string): string {
  return c.muted(p.replace(os.homedir(), "~"));
}

export async function runSetup(opts: SetupOptions): Promise<void> {
  console.log("\n" + LOGO_COMPACT);
  console.log(hr());
  console.log();

  // ── Resolve project root ──────────────────────────────────────────────────
  const root = opts.rootPath
    ? path.resolve(opts.rootPath)
    : process.cwd();

  if (opts.rootPath) {
    if (!fs.existsSync(root)) {
      console.log(cross(`Path not found: ${root}`));
      process.exit(1);
    }
    console.log(info(`Using project root: ${displayPath(root)}`));
  }

  // ── Step 1: What to install ───────────────────────────────────────────────
  let installMcp = opts.mcp;
  let installSkill = opts.skill;

  const skipInstallStep = opts.mcp || opts.skill;

  if (!skipInstallStep && !opts.yes) {
    console.log(step(1, "What would you like to install?"));
    console.log();
    const choices = [
      "MCP server config  " + c.muted("(recommended — works with all agents)"),
      "Skill file         " + c.muted("(SKILL.md for Claude Code, Kilo, Cursor, etc.)"),
    ];
    const defaults = [0];
    if (installSkill) defaults.push(1);

    const selected = await multiSelect(
      "Select what to install:",
      choices,
      defaults
    );

    installMcp = selected.includes(0);
    installSkill = selected.includes(1);
  } else if (!skipInstallStep && opts.yes) {
    installMcp = true;
  }

  if (!installMcp && !installSkill) {
    console.log("\n" + info("Nothing selected. Exiting."));
    closeReadline();
    return;
  }

  // ── Step 2: Detect agents ─────────────────────────────────────────────────
  console.log(step(2, "Detecting AI agent environments"));
  console.log();

  const allAgents = getAgents(root);
  const detectedAgents = allAgents.filter((a) => a.detected && a.id !== "other");

  if (detectedAgents.length > 0) {
    console.log(info(`Found ${c.bold(String(detectedAgents.length))} agent environment(s):`));
    detectedAgents.forEach((a) => {
      console.log(tick(a.name));
      if (installMcp && a.mcpConfigLabel) {
        console.log(`      ${c.muted("MCP:")}   ${c.muted(a.mcpConfigLabel)}`);
      }
      if (installSkill && a.skillPath) {
        console.log(`      ${c.muted("Skill:")} ${c.muted(a.skillPath.replace(os.homedir(), "~"))}`);
      }
      if (a.instructionLabel) {
        console.log(`      ${c.muted("Rules:")} ${c.muted(a.instructionLabel)}`);
      }
    });
  } else {
    console.log(info(`No agent environments auto-detected in ${c.code(root)}`));
  }
  console.log();

  const agentOptions = allAgents.map((a) => {
    const detected = a.detected ? c.success(" ✓ detected") : "";
    const global = a.isGlobal ? c.muted(" [global]") : "";
    return `${a.name}${detected}${global}`;
  });

  const defaultAgentIndices =
    detectedAgents.length > 0
      ? detectedAgents.map((a) => allAgents.findIndex((x) => x.id === a.id))
      : [0];

  let selectedAgentIndices: number[];

  if (opts.yes) {
    selectedAgentIndices = defaultAgentIndices;
  } else {
    selectedAgentIndices = await multiSelect(
      "Which agents to configure:",
      agentOptions,
      defaultAgentIndices
    );
  }

  const selectedAgents = selectedAgentIndices.map((i) => allAgents[i]);

  if (selectedAgents.length === 0) {
    console.log("\n" + info("No agents selected. Exiting."));
    closeReadline();
    return;
  }

  // ── Step 3: Project ID ────────────────────────────────────────────────────
  let projectId: string | undefined;

  if (installMcp || installSkill) {
    console.log(step(3, "Project ID"));
    console.log();

    const isGitRepo = fs.existsSync(path.join(root, ".git"));
    const detected = detectProjectId(root);

    if (!isGitRepo) {
      console.log(info(`You are not inside a git repository (${c.code(root)}).`));
      console.log(hint("  For best results, run this from the root of a project."));
      console.log();
    }

    console.log(
      info("The project ID namespaces your memories. Use your repo name or a short topic.")
    );
    console.log(hint("  Must be lowercase with underscores only (e.g. my_app, frontend_redesign)"));
    console.log();

    if (detected) {
      console.log(info(`Detected from git: ${c.code(detected)}`));
    }

    if (opts.yes) {
      projectId = (detected ?? "my_project").toLowerCase().replace(/[^a-z0-9_]/g, "_");
      console.log(info(`Using: ${c.code(projectId)}`));
    } else {
      const input = await ask(
        `  ${c.bold("Project ID")}`,
        detected ?? "my_project"
      );
      projectId = input.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (projectId !== input) {
        console.log(hint(`  Normalized to: ${c.code(projectId)}`));
      }
    }
  }

  // ── Step 4: API Key ───────────────────────────────────────────────────────
  let apiKey = "YOUR_API_KEY_HERE";

  if (installMcp) {
    console.log(step(4, "Memstate API Key"));
    console.log();
    console.log(
      info(`Get your ${c.bold("free")} API key at: ${c.brandDim("https://memstate.ai")}`)
    );
    console.log();

    if (!opts.yes) {
      const input = await ask(
        `  ${c.bold("API Key")} ${c.dim("(press Enter to add later)")}`,
        ""
      );
      if (input.trim()) {
        apiKey = input.trim();
        console.log(tick("API key saved"));
      } else {
        console.log(hint("  You can add it later by editing the MCP config file(s)."));
      }
    }
  }

  // ── Step 5: Fetch latest instructions ─────────────────────────────────────
  console.log(step(5, "Fetching latest agent instructions"));
  console.log();
  const instructions = await fetchInstructions();
  if (instructions.includes("REQUIRED")) {
    console.log(tick("Fetched latest instructions from memstate.ai"));
  } else {
    console.log(info("Using bundled instructions (offline mode)"));
  }

  // ── Step 6: Install ───────────────────────────────────────────────────────
  console.log(step(6, "Installing"));
  console.log();

  const mcpResults: { agent: Agent; success: boolean; message: string }[] = [];
  const skillResults: { agent: Agent; success: boolean; message: string }[] = [];
  const instructionResults: { agent: Agent; success: boolean; message: string }[] = [];

  // Track already-written paths to avoid duplicates
  const writtenMcpPaths = new Set<string>();
  const writtenSkillPaths = new Set<string>();
  const writtenInstructionPaths = new Set<string>();

  for (const agent of selectedAgents) {
    // ── MCP config ──────────────────────────────────────────────────────────
    const realMcpPath = fs.existsSync(agent.mcpConfigPath)
      ? fs.realpathSync(agent.mcpConfigPath)
      : agent.mcpConfigPath;

    if (installMcp && !writtenMcpPaths.has(realMcpPath)) {
      writtenMcpPaths.add(realMcpPath);

      let result: { success: boolean; message: string; created: boolean };

      if (agent.useCli) {
        // Claude Code: use the official `claude mcp add --scope user` CLI
        if (claudeCliAvailable()) {
          result = installViaClaudeCli(apiKey);
        } else {
          // claude CLI not found — fall back to direct JSON edit with a warning
          console.log(hint(`  claude CLI not found — falling back to direct JSON edit for ${agent.name}`));
          result = writeMcpConfig(agent.mcpConfigPath, apiKey, agent.mcpKey);
        }
      } else {
        result = writeMcpConfig(agent.mcpConfigPath, apiKey, agent.mcpKey);
      }

      const label = result.success ? tick : cross;
      console.log(label(`${c.bold(agent.name)} MCP config  ${c.muted(result.message)}`));
      console.log(arrow(agent.mcpConfigLabel));
      mcpResults.push({ agent, success: result.success, message: result.message });
    }

    // ── Skill file ──────────────────────────────────────────────────────────
    const realSkillPath = fs.existsSync(agent.skillPath)
      ? fs.realpathSync(agent.skillPath)
      : agent.skillPath;

    if (installSkill && !writtenSkillPaths.has(realSkillPath)) {
      writtenSkillPaths.add(realSkillPath);
      const result = writeSkillFile(agent.skillPath, SKILL_MD_CONTENT);
      const label = result.success ? tick : cross;
      console.log(label(`${c.bold(agent.name)} skill file  ${c.muted(result.message)}`));
      console.log(arrow(agent.skillPath.replace(os.homedir(), "~")));
      skillResults.push({ agent, success: result.success, message: result.message });
    }

    // ── Instruction file ────────────────────────────────────────────────────
    const realInstructionPath = agent.instructionPath && fs.existsSync(agent.instructionPath)
      ? fs.realpathSync(agent.instructionPath)
      : agent.instructionPath;

    if (
      (installMcp || installSkill) &&
      agent.instructionPath &&
      realInstructionPath &&
      projectId &&
      !writtenInstructionPaths.has(realInstructionPath)
    ) {
      writtenInstructionPaths.add(realInstructionPath);
      const iResult = appendInstructionBlock(agent.instructionPath, projectId, instructions);
      const iLabel = iResult.success ? tick : cross;
      console.log(iLabel(`${c.bold(agent.name)} instructions  ${c.muted(iResult.message)}`));
      if (agent.instructionLabel) {
        console.log(arrow(agent.instructionLabel));
      }
      instructionResults.push({ agent, success: iResult.success, message: iResult.message });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const allResults = [...mcpResults, ...skillResults, ...instructionResults];
  const allSucceeded = allResults.every((r) => r.success);

  console.log("\n" + hr("═"));
  if (allSucceeded) {
    console.log(`\n  ${c.success("✓")} ${c.bold("Setup complete!")}\n`);
  } else {
    console.log(`\n  ${c.warn("⚠")} ${c.bold("Setup finished with some errors.")}\n`);
  }

  if (projectId) {
    console.log(info(`Project ID: ${c.code(projectId)}`));
  }

  console.log();
  console.log(c.bold("  Next steps:"));
  console.log();

  if (installMcp && apiKey === "YOUR_API_KEY_HERE") {
    console.log(`  ${c.warn("1.")} Add your API key to the MCP config file(s) above`);
    console.log(hint(`     Get a free key at: https://memstate.ai`));
    console.log();
  }

  console.log(`  ${c.brandDim("2.")} Restart your AI agent to load the new configuration`);
  console.log();

  if (installSkill) {
    console.log(`  ${c.brandDim("3.")} Commit the new config files to share setup with your team`);
    console.log();
  }

  console.log(`  ${c.muted("Docs:      ")}${c.brandDim("https://memstate.ai/docs")}`);
  console.log(`  ${c.muted("Dashboard: ")}${c.brandDim("https://memstate.ai/dashboard")}`);
  console.log();

  closeReadline();
}
