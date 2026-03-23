#!/usr/bin/env node
/**
 * @memstate/skills CLI — Install Memstate AI skills into your AI coding agent
 *
 * Usage:
 *   npx @memstate/skills setup   — Interactive setup: install skill + update agent instructions
 *   npx @memstate/skills install — Install skill files only (no agent instruction updates)
 */

const command = process.argv[2];

async function main(): Promise<void> {
  switch (command) {
    case "setup": {
      const { main: setupMain } = await import("./setup.js");
      await setupMain();
      break;
    }
    case "install": {
      const { main: installMain } = await import("./install.js");
      await installMain();
      break;
    }
    default: {
      console.log(`
╔══════════════════════════════════════════════╗
║     Memstate AI Skills                       ║
║     Persistent memory for AI agents          ║
╚══════════════════════════════════════════════╝

Usage:
  npx @memstate/skills setup     Interactive setup — install skill + update agent instructions
  npx @memstate/skills install   Install skill files only

Examples:
  npx @memstate/skills setup     # Full setup for Claude Code, Cline, Cursor, etc.
  npx @memstate/skills install   # Just install the skill files

Learn more: https://memstate.ai/docs/skills
      `.trim());
      break;
    }
  }
}

main().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
