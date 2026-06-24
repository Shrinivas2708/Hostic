export const ansi = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

export function paint(code: string, text: string): string {
  return `${code}${text}${ansi.reset}`;
}

export const isTTY = Boolean(process.stdout.isTTY);
