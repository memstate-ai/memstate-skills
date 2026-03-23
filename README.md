# Memstate AI Skills

Agent Skills for [Memstate AI](https://memstate.ai) — persistent, versioned memory for AI coding agents.

## What's in this repo

| Skill | Description |
|-------|-------------|
| [`memstate/`](./memstate/) | Core Memstate memory skill — store and retrieve structured knowledge across tasks |

## Quick Install

```bash
npx @memstate/skills setup
```

This interactive CLI installs the Memstate skill into your AI agent(s) and optionally updates your project's `AGENTS.md`, `CLAUDE.md`, or `.clinerules` with pre/post task instructions.

## Manual Installation

### Claude Code (project-level)

```bash
mkdir -p .claude/skills/memstate
curl -o .claude/skills/memstate/SKILL.md \
  https://raw.githubusercontent.com/memstate-ai/memstate-skills/main/memstate/SKILL.md
```

### Claude Code (personal — all projects)

```bash
mkdir -p ~/.claude/skills/memstate
curl -o ~/.claude/skills/memstate/SKILL.md \
  https://raw.githubusercontent.com/memstate-ai/memstate-skills/main/memstate/SKILL.md
```

### Claude Code Plugin (recommended for teams)

```
/plugin marketplace add memstate-ai/memstate-skills
```

Then install:

```
/plugin install memstate@memstate-skills
```

### Cline

```bash
mkdir -p .clinerules
curl -o .clinerules/memstate.md \
  https://raw.githubusercontent.com/memstate-ai/memstate-skills/main/memstate/SKILL.md
```

### Cursor

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/memstate.mdc \
  https://raw.githubusercontent.com/memstate-ai/memstate-skills/main/memstate/SKILL.md
```

### AGENTS.md / CLAUDE.md / GEMINI.md (Universal)

Append the contents of [`memstate/SKILL.md`](./memstate/SKILL.md) to your project's `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` file.

## About the Agent Skills Standard

This repository follows the [Agent Skills open standard](https://agentskills.io/), which is supported by Claude Code, Cline, Cursor, GitHub Copilot, and other AI coding agents. Skills are portable — install once, works everywhere.

## Prerequisites

You need a Memstate API key. Get one free at [memstate.ai/dashboard](https://memstate.ai/dashboard).

Once you have a key, add the Memstate MCP server to your agent:

```json
{
  "mcpServers": {
    "memstate": {
      "command": "npx",
      "args": ["-y", "@memstate/mcp"],
      "env": {
        "MEMSTATE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

Or use the MCP setup tool:

```bash
npx @memstate/mcp setup
```

## Documentation

- [Full Documentation](https://memstate.ai/docs)
- [MCP Setup Guide](https://memstate.ai/docs/mcp/setup)
- [Tools Reference](https://memstate.ai/docs/mcp/tools)
- [Skills Guide](https://memstate.ai/docs/skills)

## License

MIT — see [LICENSE](./LICENSE)
