<div align="center">
  <img src="https://memstate.ai/logo.svg" alt="Memstate AI" width="120" />
  <h1>Memstate AI Skills</h1>
  <p><b>Persistent, versioned memory for AI coding agents.</b></p>
  <p>
    <a href="https://memstate.ai/docs">Documentation</a> •
    <a href="https://memstate.ai/dashboard">Get API Key</a> •
    <a href="https://discord.gg/memstate">Discord</a>
  </p>
</div>

---

**Memstate AI** gives your AI coding agents (Claude Code, Cline, Cursor, Windsurf) a structured, versioned memory that persists across sessions. 

Stop re-explaining your project architecture, repeating past decisions, and losing context when you start a new task. Memstate automatically tracks facts, logs changes, and ensures your agent always has the full context.

## 🚀 Quick Install

The easiest way to install the Memstate skill into your agent is via our interactive CLI:

```bash
npx @memstate/skills setup
```

This will automatically detect your environment and configure the necessary instructions for your agent.

## 🧠 How It Works

Once installed, your agent will follow a simple workflow:

1. **Before every task:** The agent calls `memstate_get` to retrieve the current project context, architecture rules, and past decisions.
2. **During the task:** The agent works normally, armed with full context.
3. **After the task:** The agent calls `memstate_remember` to save a markdown summary of what was done, what decisions were made, and what changed.

Memstate's custom-trained AI models automatically extract keypaths, detect conflicts, and version the information. You never have to manage the memory structure manually.

## 📦 Manual Installation

If you prefer to install manually, follow the instructions for your specific agent:

### Claude Code (Project-level)
```bash
mkdir -p .claude/skills/memstate
curl -o .claude/skills/memstate/SKILL.md \
  https://raw.githubusercontent.com/memstate-ai/memstate-skills/main/memstate/SKILL.md
```

### Claude Code (Global — all projects)
```bash
mkdir -p ~/.claude/skills/memstate
curl -o ~/.claude/skills/memstate/SKILL.md \
  https://raw.githubusercontent.com/memstate-ai/memstate-skills/main/memstate/SKILL.md
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

### Universal (AGENTS.md / CLAUDE.md / GEMINI.md)
Append the contents of [`memstate/SKILL.md`](./memstate/SKILL.md) to your project's instruction file.

## ⚙️ Prerequisites

1. Get a free API key at [memstate.ai/dashboard](https://memstate.ai/dashboard).
2. Add the Memstate MCP server to your agent's configuration:

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

## 📚 Documentation

- [Full Documentation](https://memstate.ai/docs)
- [MCP Setup Guide](https://memstate.ai/docs/mcp/setup)
- [Tools Reference](https://memstate.ai/docs/mcp/tools)
- [Skills Guide](https://memstate.ai/docs/skills)

## 📄 License

MIT — see [LICENSE](./LICENSE)
