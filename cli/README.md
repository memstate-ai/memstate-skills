# @memstate/skills

Install [Memstate AI](https://memstate.ai) skills into your AI coding agent — Claude Code, Cline, Cursor, Windsurf, and more.

## Quick Start

```bash
npx @memstate/skills setup
```

This interactive CLI will:
1. Detect your project ID from the git repo name (or prompt you)
2. Install the Memstate skill to the correct location for your agent(s)
3. Update your `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or `.clinerules` with pre/post task instructions
4. Guide you through MCP server configuration

## Commands

```bash
npx @memstate/skills setup     # Full interactive setup (recommended)
npx @memstate/skills install   # Install skill files only
```

## What Gets Installed

| Agent | Skill Location | Instruction File |
|-------|---------------|-----------------|
| Claude Code (project) | `.claude/skills/memstate/SKILL.md` | `CLAUDE.md` |
| Claude Code (personal) | `~/.claude/skills/memstate/SKILL.md` | — |
| Cline | `.clinerules/memstate.md` | `.clinerules/memstate.md` |
| Cursor | `.cursor/rules/memstate.mdc` | `.cursor/rules/memstate.mdc` |
| AGENTS.md (universal) | `.claude/skills/memstate/SKILL.md` | `AGENTS.md` |
| Gemini CLI | `.claude/skills/memstate/SKILL.md` | `GEMINI.md` |

## What the Skill Does

The Memstate skill teaches your AI agent to:
- **Before every task**: Check existing project memories to avoid duplicate work
- **After every task**: Save a markdown summary of what was done
- Use `memstate_remember` for summaries (preferred) and `memstate_set` for single facts

## Prerequisites

You need the Memstate MCP server configured with an API key. Get one free at [memstate.ai/dashboard](https://memstate.ai/dashboard).

```bash
npx @memstate/mcp setup
```

## Documentation

- [Skills Guide](https://memstate.ai/docs/skills)
- [MCP Setup](https://memstate.ai/docs/mcp/setup)
- [Tools Reference](https://memstate.ai/docs/mcp/tools)

## License

MIT
