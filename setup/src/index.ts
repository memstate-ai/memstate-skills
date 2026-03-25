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
  mcpServerStanza,
  type Agent,
} from "./agents.js";
export { SKILL_MD_CONTENT } from "./skill-content.js";
