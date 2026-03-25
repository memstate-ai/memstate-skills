import kleur from "kleur";

// ── Brand palette ─────────────────────────────────────────────────────────────
export const c = {
  // Primary brand color — used for logo, headings, highlights
  brand: (s: string) => kleur.cyan().bold(s),
  // Dim brand — used for URLs, secondary info
  brandDim: (s: string) => kleur.cyan(s),
  // Success
  success: (s: string) => kleur.green().bold(s),
  successDim: (s: string) => kleur.green(s),
  // Warning / attention
  warn: (s: string) => kleur.yellow().bold(s),
  warnDim: (s: string) => kleur.yellow(s),
  // Error
  error: (s: string) => kleur.red().bold(s),
  // Muted — used for paths, secondary labels
  muted: (s: string) => kleur.gray(s),
  // Bold white — used for labels, step headers
  bold: (s: string) => kleur.white().bold(s),
  // Normal white
  white: (s: string) => kleur.white(s),
  // Dim white — used for hints
  dim: (s: string) => kleur.white().dim(s),
  // Code / monospace values
  code: (s: string) => kleur.cyan(s),
};

export const LOGO = `
  ${c.brand("███╗   ███╗███████╗███╗   ███╗███████╗████████╗ █████╗ ████████╗███████╗")}
  ${c.brand("████╗ ████║██╔════╝████╗ ████║██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝")}
  ${c.brand("██╔████╔██║█████╗  ██╔████╔██║███████╗   ██║   ███████║   ██║   █████╗  ")}
  ${c.brand("██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║╚════██║   ██║   ██╔══██║   ██║   ██╔══╝  ")}
  ${c.brand("██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║███████║   ██║   ██║  ██║   ██║   ███████╗")}
  ${c.brand("╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝")}
`;

export const LOGO_COMPACT = `  ${c.brand("Memstate AI")} ${c.muted("— persistent memory for AI agents")}`;

export function hr(char = "─", width = 56): string {
  return c.muted(char.repeat(width));
}

export function step(n: number, label: string): string {
  return `\n${c.brand(`[${n}]`)} ${c.bold(label)}\n${hr()}`;
}

export function tick(label: string): string {
  return `  ${c.success("✓")} ${label}`;
}

export function cross(label: string): string {
  return `  ${c.error("✗")} ${label}`;
}

export function arrow(label: string): string {
  return `  ${c.muted("→")} ${c.muted(label)}`;
}

export function info(label: string): string {
  return `  ${c.brandDim("·")} ${label}`;
}

export function hint(label: string): string {
  return `  ${c.dim(label)}`;
}
