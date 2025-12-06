#!/usr/bin/env node
/**
 * npm dependency license checker
 * Ensures all dependencies use permissive licenses compatible with MIT.
 */

import { execSync } from "node:child_process";

// Licenses compatible with MIT
const ALLOWED_LICENSES = [
  "MIT",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
  "CC0-1.0",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "Unlicense",
  "WTFPL",
  "BlueOak-1.0.0",
  "Python-2.0",
  "MPL-2.0", // File-level copyleft; compatible if we don't modify MPL files
  "(MIT OR Apache-2.0)",
  "(MIT OR CC0-1.0)",
  "(Apache-2.0 OR MIT)",
  "MIT*", // Some packages use MIT* notation
];

// Packages to skip (known false positives or special cases)
const SKIP_PACKAGES = [
  // Add packages here if they have unusual license strings but are actually permissive
];

function normalizePackageName(name) {
  // Handle scoped packages like @scope/package@version
  return name.replace(/@[\d.]+$/, "");
}

function isAllowedLicense(license) {
  if (!license || license === "Unknown") {
    return false;
  }

  // Direct match
  if (ALLOWED_LICENSES.includes(license)) {
    return true;
  }

  // Handle OR expressions like "(MIT OR Apache-2.0)"
  if (license.includes(" OR ")) {
    const parts = license
      .replace(/[()]/g, "")
      .split(" OR ")
      .map((l) => l.trim());
    return parts.some(
      (part) =>
        ALLOWED_LICENSES.includes(part) ||
        ALLOWED_LICENSES.some((allowed) => part.startsWith(allowed))
    );
  }

  // Handle AND expressions - all must be allowed
  if (license.includes(" AND ")) {
    const parts = license
      .replace(/[()]/g, "")
      .split(" AND ")
      .map((l) => l.trim());
    return parts.every(
      (part) =>
        ALLOWED_LICENSES.includes(part) ||
        ALLOWED_LICENSES.some((allowed) => part.startsWith(allowed))
    );
  }

  return false;
}

async function main() {
  console.log("Checking npm dependency licenses...\n");

  let licensesJson;
  try {
    licensesJson = execSync("pnpm licenses list --json", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    console.error("Failed to get licenses:", error.message);
    process.exit(1);
  }

  const licenses = JSON.parse(licensesJson);
  const violations = [];
  const checked = new Set();

  for (const [license, packages] of Object.entries(licenses)) {
    for (const pkg of packages) {
      const pkgName = normalizePackageName(pkg.name);
      const key = `${pkgName}@${pkg.version}`;

      if (checked.has(key)) continue;
      checked.add(key);

      if (SKIP_PACKAGES.includes(pkgName)) {
        console.log(`⏭️  Skipped: ${key} (${license})`);
        continue;
      }

      if (!isAllowedLicense(license)) {
        violations.push({ name: pkgName, version: pkg.version, license });
      }
    }
  }

  console.log(`Checked ${checked.size} packages\n`);

  if (violations.length > 0) {
    console.error("❌ License violations found:\n");
    for (const v of violations) {
      console.error(`  ${v.name}@${v.version}: ${v.license}`);
    }
    console.error(
      "\nThese licenses may not be compatible with MIT. Please review and either:"
    );
    console.error("  1. Replace the dependency with an alternative");
    console.error("  2. Add to SKIP_PACKAGES if it's a false positive");
    console.error("  3. Add to ALLOWED_LICENSES if the license is permissive");
    process.exit(1);
  }

  console.log("✅ All licenses are compatible with MIT");
}

main();
