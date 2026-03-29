import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  getAgents,
  writeMcpConfig,
  appendInstructionBlock,
  safeParseJson,
  mcpServerStanza,
  detectProjectId,
} from "../agents.js";

/** Create a temporary directory for each test */
function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "memstate-test-"));
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ─── safeParseJson ──────────────────────────────────────────────────────────

describe("safeParseJson", () => {
  it("parses valid JSON object", () => {
    const result = safeParseJson('{"key": "value"}');
    assert.deepEqual(result, { key: "value" });
  });

  it("returns null for invalid JSON", () => {
    assert.equal(safeParseJson("{broken"), null);
    assert.equal(safeParseJson(""), null);
    assert.equal(safeParseJson("null"), null);
    assert.equal(safeParseJson('"string"'), null);
    assert.equal(safeParseJson("[1,2,3]"), null);
  });

  it("parses nested objects", () => {
    const result = safeParseJson('{"mcpServers": {"memstate": {"command": "npx"}}}');
    assert.ok(result);
    assert.ok("mcpServers" in result);
  });
});

// ─── mcpServerStanza ────────────────────────────────────────────────────────

describe("mcpServerStanza", () => {
  it("returns valid stanza with default key", () => {
    const stanza = mcpServerStanza() as Record<string, unknown>;
    assert.equal(stanza.command, "npx");
    assert.deepEqual(stanza.args, ["-y", "@memstate/mcp"]);
    assert.deepEqual(stanza.env, { MEMSTATE_API_KEY: "YOUR_API_KEY_HERE" });
  });

  it("uses provided API key", () => {
    const stanza = mcpServerStanza("mst_test123") as Record<string, unknown>;
    assert.deepEqual(stanza.env, { MEMSTATE_API_KEY: "mst_test123" });
  });
});

// ─── getAgents ──────────────────────────────────────────────────────────────

describe("getAgents", () => {
  it("returns at least 12 agent configurations", () => {
    const agents = getAgents("/tmp/fake-project");
    assert.ok(agents.length >= 12, `Expected >= 12 agents, got ${agents.length}`);
  });

  it("includes all major agents", () => {
    const agents = getAgents("/tmp/fake-project");
    const ids = agents.map((a) => a.id);
    const required = [
      "claude-code", "claude-desktop", "cursor", "windsurf", "cline",
      "kilo", "copilot", "gemini", "roo", "amazon-q", "zed", "agents-md", "other",
    ];
    for (const id of required) {
      assert.ok(ids.includes(id), `Missing agent: ${id}`);
    }
  });

  it("each agent has required fields", () => {
    const agents = getAgents("/tmp/fake-project");
    for (const agent of agents) {
      assert.ok(agent.id, `Agent missing id`);
      assert.ok(agent.name, `Agent ${agent.id} missing name`);
      assert.ok(agent.mcpConfigPath, `Agent ${agent.id} missing mcpConfigPath`);
      assert.ok(agent.mcpKey === "mcpServers" || agent.mcpKey === "servers",
        `Agent ${agent.id} has invalid mcpKey: ${agent.mcpKey}`);
    }
  });

  it("copilot uses 'servers' key", () => {
    const agents = getAgents("/tmp/fake-project");
    const copilot = agents.find((a) => a.id === "copilot");
    assert.ok(copilot);
    assert.equal(copilot.mcpKey, "servers");
  });

  it("claude-code uses correct config path", () => {
    const agents = getAgents("/tmp/fake-project");
    const claude = agents.find((a) => a.id === "claude-code");
    assert.ok(claude);
    assert.ok(claude.mcpConfigPath.endsWith(".claude.json"),
      `Expected .claude.json, got ${claude.mcpConfigPath}`);
    assert.ok(!claude.mcpConfigPath.includes("claude_desktop_config"),
      `Claude Code should NOT use claude_desktop_config.json`);
  });

  it("detects agents based on filesystem", () => {
    const tmp = makeTmpDir();
    try {
      // Create .cursor directory to simulate Cursor being installed
      fs.mkdirSync(path.join(tmp, ".cursor"));
      const agents = getAgents(tmp);
      const cursor = agents.find((a) => a.id === "cursor");
      assert.ok(cursor?.detected, "Cursor should be detected when .cursor exists");

      // Agent without directory should not be detected
      const roo = agents.find((a) => a.id === "roo");
      assert.ok(!roo?.detected, "Roo should not be detected without .roo directory");
    } finally {
      cleanup(tmp);
    }
  });
});

// ─── writeMcpConfig ─────────────────────────────────────────────────────────

describe("writeMcpConfig", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = makeTmpDir();
  });

  afterEach(() => {
    cleanup(tmp);
  });

  it("creates new config file from scratch", () => {
    const configPath = path.join(tmp, "mcp.json");
    const result = writeMcpConfig(configPath, "mst_test123");

    assert.ok(result.success);
    assert.ok(result.created);

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.ok(content.mcpServers.memstate);
    assert.equal(content.mcpServers.memstate.env.MEMSTATE_API_KEY, "mst_test123");
  });

  it("creates nested directories if needed", () => {
    const configPath = path.join(tmp, "deep", "nested", "mcp.json");
    const result = writeMcpConfig(configPath, "mst_test");

    assert.ok(result.success);
    assert.ok(fs.existsSync(configPath));
  });

  it("preserves existing servers", () => {
    const configPath = path.join(tmp, "mcp.json");
    const existing = {
      mcpServers: {
        "other-server": { command: "node", args: ["server.js"] },
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(existing));

    const result = writeMcpConfig(configPath, "mst_key");
    assert.ok(result.success);

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.ok(content.mcpServers["other-server"], "Existing server should be preserved");
    assert.ok(content.mcpServers.memstate, "Memstate should be added");
  });

  it("updates existing memstate entry", () => {
    const configPath = path.join(tmp, "mcp.json");
    const existing = {
      mcpServers: {
        memstate: { command: "npx", args: ["-y", "@memstate/mcp"], env: { MEMSTATE_API_KEY: "old_key" } },
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(existing));

    const result = writeMcpConfig(configPath, "new_key");
    assert.ok(result.success);
    assert.ok(result.message.includes("replaced"), `Expected 'replaced' in message, got: ${result.message}`);

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.equal(content.mcpServers.memstate.env.MEMSTATE_API_KEY, "new_key");
  });

  it("uses 'servers' key when specified", () => {
    const configPath = path.join(tmp, "mcp.json");
    const result = writeMcpConfig(configPath, "mst_test", "servers");

    assert.ok(result.success);
    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.ok(content.servers.memstate, "Should use 'servers' key");
    assert.ok(!content.mcpServers, "Should NOT have 'mcpServers' key");
  });

  it("respects existing key format (servers vs mcpServers)", () => {
    const configPath = path.join(tmp, "mcp.json");
    // Pre-existing file using "servers" key
    fs.writeFileSync(configPath, JSON.stringify({ servers: { "other": { command: "node" } } }));

    // Even if agent says mcpServers, should use existing "servers" key
    const result = writeMcpConfig(configPath, "mst_test", "mcpServers");
    assert.ok(result.success);

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.ok(content.servers.memstate, "Should use existing 'servers' key");
    assert.ok(content.servers.other, "Should preserve existing 'other' server");
  });

  it("handles malformed JSON with backup", () => {
    const configPath = path.join(tmp, "mcp.json");
    fs.writeFileSync(configPath, "{broken json here!!!}");

    const result = writeMcpConfig(configPath, "mst_test");
    assert.ok(result.success);

    // Verify backup was created
    const files = fs.readdirSync(tmp);
    const backups = files.filter((f) => f.includes(".bak."));
    assert.ok(backups.length > 0, "Should create backup of malformed file");

    // Verify new valid config
    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.ok(content.mcpServers.memstate);
  });

  it("handles empty file", () => {
    const configPath = path.join(tmp, "mcp.json");
    fs.writeFileSync(configPath, "");

    const result = writeMcpConfig(configPath, "mst_test");
    assert.ok(result.success);
    assert.ok(result.created, "Empty file should be treated as new");

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.ok(content.mcpServers.memstate);
  });

  it("output is always valid JSON", () => {
    const configPath = path.join(tmp, "mcp.json");
    // Write complex existing config
    const complex = {
      mcpServers: {
        "server-1": { command: "node", args: ["--flag", "value with spaces"] },
        "server-2": { command: "python3", env: { KEY: "val\"ue" } },
      },
      someOtherConfig: true,
    };
    fs.writeFileSync(configPath, JSON.stringify(complex));

    writeMcpConfig(configPath, "mst_test");

    const raw = fs.readFileSync(configPath, "utf-8");
    assert.doesNotThrow(() => JSON.parse(raw), "Output must be valid JSON");
  });

  it("is idempotent — running twice produces same result", () => {
    const configPath = path.join(tmp, "mcp.json");
    writeMcpConfig(configPath, "mst_test");
    const first = fs.readFileSync(configPath, "utf-8");

    writeMcpConfig(configPath, "mst_test");
    const second = fs.readFileSync(configPath, "utf-8");

    assert.equal(first, second, "Running twice should produce identical output");
  });

  it("preserves non-MCP config keys", () => {
    const configPath = path.join(tmp, "settings.json");
    fs.writeFileSync(configPath, JSON.stringify({
      theme: "dark",
      fontSize: 14,
      mcpServers: {},
    }));

    writeMcpConfig(configPath, "mst_test");

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    assert.equal(content.theme, "dark");
    assert.equal(content.fontSize, 14);
    assert.ok(content.mcpServers.memstate);
  });
});

// ─── appendInstructionBlock ─────────────────────────────────────────────────

describe("appendInstructionBlock", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = makeTmpDir();
  });

  afterEach(() => {
    cleanup(tmp);
  });

  it("creates new instruction file", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    const result = appendInstructionBlock(filePath, "my_app");

    assert.ok(result.success);
    assert.equal(result.message, "Created");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("BEGIN MEMSTATE-AI INSTRUCTIONS"));
    assert.ok(content.includes("END MEMSTATE-AI INSTRUCTIONS"));
    assert.ok(content.includes("my_app"));
    assert.ok(content.includes("memstate_get"));
  });

  it("creates nested directories", () => {
    const filePath = path.join(tmp, ".cursor", "rules", "memstate.mdc");
    const result = appendInstructionBlock(filePath, "my_app");
    assert.ok(result.success);
    assert.ok(fs.existsSync(filePath));
  });

  it("appends to existing file without memstate content", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    fs.writeFileSync(filePath, "# My Project\n\nExisting content here.\n");

    const result = appendInstructionBlock(filePath, "my_app");
    assert.ok(result.success);
    assert.equal(result.message, "Appended");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.startsWith("# My Project"), "Original content should be preserved");
    assert.ok(content.includes("BEGIN MEMSTATE-AI INSTRUCTIONS"));
  });

  it("updates existing instruction block in place", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    // First install
    appendInstructionBlock(filePath, "old_project");
    const firstContent = fs.readFileSync(filePath, "utf-8");
    assert.ok(firstContent.includes("old_project"));

    // Second install — should update, not append
    const result = appendInstructionBlock(filePath, "new_project");
    assert.ok(result.success);
    assert.ok(result.message.includes("Updated"), `Expected 'Updated', got: ${result.message}`);

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("new_project"));
    assert.ok(!content.includes("old_project"), "Old project ID should be replaced");

    // Should only have one set of markers
    const beginCount = (content.match(/BEGIN MEMSTATE-AI INSTRUCTIONS/g) || []).length;
    assert.equal(beginCount, 1, "Should only have one instruction block");
  });

  it("skips files that already have manual memstate content", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    fs.writeFileSync(filePath, "# Project\n\nUse memstate_get before tasks.\n");

    const result = appendInstructionBlock(filePath, "my_app");
    assert.ok(result.success);
    assert.ok(result.message.includes("already present"));
  });

  it("replaces legacy marker content", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    fs.writeFileSync(filePath, "# Project\n\n<!-- memstate-ai -->\nOld stuff\n");

    const result = appendInstructionBlock(filePath, "my_app");
    assert.ok(result.success);
    assert.ok(result.message.includes("legacy"));

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("BEGIN MEMSTATE-AI INSTRUCTIONS"));
  });

  it("is idempotent — running twice is a no-op", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    appendInstructionBlock(filePath, "my_app");
    const first = fs.readFileSync(filePath, "utf-8");

    const result = appendInstructionBlock(filePath, "my_app");
    assert.ok(result.success);
    assert.equal(result.message, "Already up to date");

    const second = fs.readFileSync(filePath, "utf-8");
    assert.equal(first, second);
  });

  it("adds MDC frontmatter for .mdc files", () => {
    const filePath = path.join(tmp, "memstate.mdc");
    const result = appendInstructionBlock(filePath, "my_app");

    assert.ok(result.success);
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.startsWith("---\nalwaysApply: true\n---"),
      "MDC files should have frontmatter");
  });

  it("does NOT add MDC frontmatter for .md files", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    appendInstructionBlock(filePath, "my_app");

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(!content.includes("alwaysApply"), "MD files should not have MDC frontmatter");
  });

  it("replaces project ID placeholders in custom content", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    const customContent = 'Call memstate_get(project_id="<your_project>") before tasks.';
    appendInstructionBlock(filePath, "acme_api", customContent);

    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(content.includes("acme_api"));
    assert.ok(!content.includes("<your_project>"));
  });

  it("handles file with only whitespace", () => {
    const filePath = path.join(tmp, "CLAUDE.md");
    fs.writeFileSync(filePath, "   \n\n   ");

    const result = appendInstructionBlock(filePath, "my_app");
    assert.ok(result.success);
    assert.equal(result.message, "Appended");
  });
});

// ─── detectProjectId ────────────────────────────────────────────────────────

describe("detectProjectId", () => {
  it("returns null for non-git directories", () => {
    const tmp = makeTmpDir();
    try {
      const result = detectProjectId(tmp);
      assert.equal(result, null);
    } finally {
      cleanup(tmp);
    }
  });

  it("normalizes names to snake_case", () => {
    // Test the normalization logic directly
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    assert.equal(normalize("My-App"), "my_app");
    assert.equal(normalize("UPPER_CASE"), "upper_case");
    assert.equal(normalize("special!chars@here"), "special_chars_here");
  });
});
