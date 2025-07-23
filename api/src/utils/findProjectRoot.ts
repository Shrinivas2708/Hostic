import fs from "fs";
import path from "path";

/**
 * Recursively search for a package.json file.
 * Returns the absolute path to the folder containing package.json.
 */
export function findProjectRoot(startDir: string): string | null {
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  // Check if package.json exists in current directory
  if (entries.find(e => e.name === "package.json")) {
    return startDir;
  }

  // Recursively check subdirectories
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const found = findProjectRoot(path.join(startDir, entry.name));
      if (found) return found;
    }
  }

  return null;
}
