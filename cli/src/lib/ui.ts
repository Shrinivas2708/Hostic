export function ok(message: string): void {
  console.log(`\x1b[32m✓\x1b[0m ${message}`);
}

export function info(message: string): void {
  console.log(`\x1b[36m→\x1b[0m ${message}`);
}

export function warn(message: string): void {
  console.log(`\x1b[33m!\x1b[0m ${message}`);
}

export function fail(message: string): never {
  console.error(`\x1b[31m✗\x1b[0m ${message}`);
  process.exit(1);
}

export function dieIfApiError(err: unknown): never {
  if (err && typeof err === "object" && "message" in err) {
    fail(String((err as { message: string }).message));
  }
  fail("Unexpected error");
}
