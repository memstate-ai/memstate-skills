# @memstate/setup

> Set up [Memstate AI](https://memstate.ai) persistent memory for your AI coding agent in seconds.

```
npx @memstate/setup
```

Detects your AI agent environment (Claude Code, Cursor, Cline, Windsurf, Kilo Code, Claude Desktop) and installs the Memstate MCP server config and/or skill file automatically.

---

## What it installs

### MCP server config *(recommended — default)*

Writes the Memstate server stanza into your agent's MCP config file so tools like `memstate_get`, `memstate_remember`, and `memstate_search` are available in every session.

```json
{
  "mcpServers": {
    "memstate": {
      "command": "npx",
      "args": ["-y", "@memstate/mcp"],
      "env": { "MEMSTATE_API_KEY": "your_key_here" }
    }
  }
}
```

### Skill file *(optional)*

Installs `SKILL.md` to the correct location for skill-based agents (Claude Code, Kilo Code, Cursor rules, etc.) and appends workflow instructions to `CLAUDE.md` / `.clinerules` / etc.

---

## Usage

```bash
npx @memstate/setup                   # Interactive setup (recommended)
npx @memstate/setup --mcp             # MCP config only
npx @memstate/setup --skill           # Skill file only
npx @memstate/setup --mcp --skill     # Both
npx @memstate/setup --path ~/my/proj  # Custom project root
npx @memstate/setup --yes             # Accept all defaults
npx @memstate/setup --help            # Full help
```

## Options

| Flag | Description |
|------|-------------|
| `--mcp` | Install MCP server config |
| `--skill` | Install SKILL.md |
| `--path <dir>` | Use a custom project root |
| `--global, -g` | Prefer global (user-level) install |
| `--project` | Prefer project-level install *(default)* |
| `--yes, -y` | Accept all defaults without prompting |
| `--help, -h` | Show help |
| `--version, -v` | Show version |

---

## Get a free API key

[memstate.ai/dashboard/api-keys](https://memstate.ai/dashboard/api-keys) — free to sign up, no credit card required.

---

## Links

- **Docs:** https://memstate.ai/docs
- **GitHub:** https://github.com/memstate-ai/memstate-skills
- **npm:** https://www.npmjs.com/package/@memstate/setup
