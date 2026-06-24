export function ok(message: string): void {
  console.log(`${ANSI.green}✓${ANSI.reset} ${message}`);
}

export function info(message: string): void {
  console.log(`${ANSI.cyan}→${ANSI.reset} ${message}`);
}

export function warn(message: string): void {
  console.log(`${ANSI.yellow}!${ANSI.reset} ${message}`);
}

export function fail(message: string): never {
  console.error(`${ANSI.red}✗${ANSI.reset} ${message}`);
  process.exit(1);
}

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

export function dieIfApiError(err: unknown): never {
  if (err && typeof err === "object" && "message" in err) {
    fail(String((err as { message: string }).message));
  }
  fail("Unexpected error");
}
