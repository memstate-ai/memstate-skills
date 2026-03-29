/**
 * @memstate/setup — Public API for programmatic use
 *
 * Most users should run: npx @memstate/setup
 */

export { runSetup, type SetupOptions } from "./setup.js";
export {
  getAgents,
  detectProjectId,
  writeMcpConfig,
  writeSkillFile,
  appendInstructionBlock,
  fetchInstructions,
  mcpServerStanza,
  safeParseJson,
  INSTRUCTIONS_URL,
  INSTRUCTION_VERSION,
  type Agent,
} from "./agents.js";
export { SKILL_MD_CONTENT } from "./skill-content.js";
