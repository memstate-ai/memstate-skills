#!/usr/bin/env node
/**
 * @memstate/setup — Set up Memstate AI persistent memory for your AI coding agent
 *
 * Usage:
 *   npx @memstate/setup            Interactive setup (recommended)
 *   npx @memstate/setup --mcp      Install MCP server config only
 *   npx @memstate/setup --skill    Install SKILL.md only
 *   npx @memstate/setup --help     Show help
 */

import minimist from "minimist";
import { c, LOGO_COMPACT, hr } from "./theme.js";
import { runSetup } from "./setup.js";

const argv = minimist(process.argv.slice(2), {
  boolean: ["mcp", "skill", "global", "project", "yes", "help", "version"],
  string: ["path"],
  alias: {
    h: "help",
    v: "version",
    y: "yes",
    p: "path",
    g: "global",
  },
  default: {
    mcp: false,
    skill: false,
    global: false,
    project: false,
    yes: false,
    help: false,
    version: false,
  },
});

function showHelp(): void {
  console.log(`
${LOGO_COMPACT}
${hr()}

  ${c.bold("USAGE")}

    ${c.code("npx @memstate/setup")}                  Interactive setup ${c.muted("(recommended)")}
    ${c.code("npx @memstate/setup --mcp")}             Install MCP server config only
    ${c.code("npx @memstate/setup --skill")}           Install SKILL.md only
    ${c.code("npx @memstate/setup --mcp --skill")}     Install both

  ${c.bold("OPTIONS")}

    ${c.code("--mcp")}          Install the MCP server config into your agent's config file
    ${c.code("--skill")}        Install the SKILL.md file for skill-based agents
    ${c.code("--path <dir>")}   Use a custom project root instead of the current directory
    ${c.code("--global, -g")}   Prefer global (user-level) install locations
    ${c.code("--project")}      Prefer project-level install locations ${c.muted("(default)")}
    ${c.code("--yes, -y")}      Accept all defaults without prompting
    ${c.code("--help, -h")}     Show this help message
    ${c.code("--version, -v")}  Show version

  ${c.bold("EXAMPLES")}

    ${c.muted("# Interactive setup from your project directory")}
    ${c.code("npx @memstate/setup")}

    ${c.muted("# Install MCP config only, no prompts")}
    ${c.code("npx @memstate/setup --mcp --yes")}

    ${c.muted("# Set up a project at a specific path")}
    ${c.code("npx @memstate/setup --path ~/projects/my_app")}

    ${c.muted("# Install both MCP and skill for a specific project")}
    ${c.code("npx @memstate/setup --mcp --skill --path ~/projects/my_app")}

  ${c.bold("WHAT IT DOES")}

    ${c.muted("MCP install:")}   Writes the Memstate server stanza into your agent's MCP
                  config file (e.g. .cursor/mcp.json, claude_desktop_config.json)

    ${c.muted("Skill install:")} Writes SKILL.md to the correct location for your agent
                  and appends workflow instructions to CLAUDE.md / .clinerules / etc.

  ${c.bold("LINKS")}

    ${c.muted("Docs:      ")}${c.brandDim("https://memstate.ai/docs")}
    ${c.muted("API Keys:  ")}${c.brandDim("https://memstate.ai")}
    ${c.muted("GitHub:    ")}${c.brandDim("https://github.com/memstate-ai/memstate-skills")}
`);
}

function showVersion(): void {
  console.log("1.0.2");
}

async function main(): Promise<void> {
  if (argv.help) {
    showHelp();
    process.exit(0);
  }

  if (argv.version) {
    showVersion();
    process.exit(0);
  }

  // If neither --mcp nor --skill is passed, default to interactive mode
  // where MCP is the default selection
  const explicitMcp = argv.mcp as boolean;
  const explicitSkill = argv.skill as boolean;

  await runSetup({
    // If explicit flags given, honour them. Otherwise interactive will ask.
    mcp: explicitMcp,
    skill: explicitSkill,
    global: argv.global as boolean,
    project: argv.project as boolean,
    rootPath: argv.path as string | undefined,
    yes: argv.yes as boolean,
  });
}

main().catch((err) => {
  console.error(
    `\n  ${c.error("Error:")} ${err instanceof Error ? err.message : String(err)}\n`
  );
  process.exit(1);
});
