import * as readline from "readline";
import kleur from "kleur";
import { c } from "./theme.js";

let rl: readline.Interface | null = null;

export function getReadline(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

export function closeReadline(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}

/**
 * Ask a yes/no question. Returns true for yes, false for no.
 * Default is shown in brackets and used when user presses Enter.
 */
export async function confirm(
  question: string,
  defaultYes = true
): Promise<boolean> {
  const hint = defaultYes
    ? kleur.dim(" [Y/n] ")
    : kleur.dim(" [y/N] ");
  const answer = await ask(`${question}${hint}`);
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === "") return defaultYes;
  return trimmed === "y" || trimmed === "yes";
}

/**
 * Ask a free-text question with an optional default value.
 */
export async function ask(
  question: string,
  defaultValue?: string
): Promise<string> {
  const rl = getReadline();
  const suffix = defaultValue ? c.dim(` (${defaultValue})`) : "";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Present a numbered list and return the selected index (0-based).
 * Supports a default selection shown in brackets.
 */
export async function select(
  question: string,
  options: string[],
  defaultIndex = 0
): Promise<number> {
  console.log(`\n  ${c.bold(question)}`);
  options.forEach((opt, i) => {
    const num = c.brandDim(`${i + 1}.`);
    const isDefault = i === defaultIndex;
    const label = isDefault ? c.white(opt) : c.dim(opt);
    const def = isDefault ? c.muted(" ← default") : "";
    console.log(`     ${num} ${label}${def}`);
  });
  const answer = await ask(
    `\n  ${c.dim("Enter number")}`,
    String(defaultIndex + 1)
  );
  const parsed = parseInt(answer, 10) - 1;
  if (parsed >= 0 && parsed < options.length) return parsed;
  return defaultIndex;
}

/**
 * Present a multi-select checklist. Returns array of selected indices (0-based).
 * defaultSelected is an array of indices that are pre-checked.
 */
export async function multiSelect(
  question: string,
  options: string[],
  defaultSelected: number[]
): Promise<number[]> {
  const defaultSet = new Set(defaultSelected);
  console.log(`\n  ${c.bold(question)}`);
  console.log(c.dim("  (comma-separated numbers, or Enter to accept defaults)\n"));
  options.forEach((opt, i) => {
    const num = c.brandDim(`${i + 1}.`);
    const checked = defaultSet.has(i) ? c.success("✓") : c.muted("○");
    const label = defaultSet.has(i) ? c.white(opt) : c.dim(opt);
    console.log(`     ${checked} ${num} ${label}`);
  });

  const defaultStr = defaultSelected.map((i) => i + 1).join(",");
  const answer = await ask(`\n  ${c.dim("Selection")}`, defaultStr);

  if (!answer.trim()) return defaultSelected;

  const indices = answer
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < options.length);

  return [...new Set(indices)];
}
