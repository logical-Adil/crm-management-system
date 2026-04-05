import path from "node:path";
import { createRequire } from "node:module";

import type { NextConfig } from "next";

const require = createRequire(path.join(process.cwd(), "package.json"));

/**
 * TanStack Query publishes a `build/modern` entry (private class fields, etc.) and a
 * `build/legacy` entry without that syntax. Next dev often still serves the modern
 * build inside eval chunks, which breaks older engines ("Invalid or unexpected token").
 * Aliasing to `legacy` fixes dev + prod consistently.
 */
function tanstackLegacyAliases(): Record<string, string> {
  const reactQueryPkg = require.resolve("@tanstack/react-query/package.json");
  const reactQueryDir = path.dirname(reactQueryPkg);
  const queryCorePkg = require.resolve("@tanstack/query-core/package.json", {
    paths: [reactQueryDir],
  });
  const queryCoreDir = path.dirname(queryCorePkg);
  return {
    "@tanstack/react-query": path.join(reactQueryDir, "build", "legacy", "index.js"),
    "@tanstack/query-core": path.join(queryCoreDir, "build", "legacy", "index.js"),
  };
}

const nextConfig: NextConfig = {
  transpilePackages: ["@tanstack/react-query", "@tanstack/query-core"],
  webpack(config) {
    const aliases = tanstackLegacyAliases();
    const prev = config.resolve.alias;
    if (Array.isArray(prev)) {
      config.resolve.alias = [
        ...prev,
        ...Object.entries(aliases).map(([name, alias]) => ({ name, alias })),
      ];
    } else {
      config.resolve.alias = { ...(prev ?? {}), ...aliases };
    }
    return config;
  },
};

export default nextConfig;
