import { type, action } from "@contentful/skill-kit";
import { join } from "node:path";
import { readdir, readFile, access } from "node:fs/promises";
import {
  PackagesAndEnvResult,
  type PackageInfo,
  type EnvVarInfo,
} from "../schemas.js";

const NINETAILED_PACKAGES = [
  "@ninetailed/experience.js",
  "@ninetailed/experience.js-next",
  "@ninetailed/experience.js-react",
  "@ninetailed/experience.js-gatsby",
  "@ninetailed/experience.js-remix",
  "@ninetailed/experience.js-plugin-insights",
  "@ninetailed/experience.js-plugin-preview",
  "@ninetailed/experience.js-plugin-google-tagmanager",
  "@ninetailed/experience.js-plugin-segment",
  "@ninetailed/experience.js-plugin-contentsquare",
  "@ninetailed/experience.js-shared",
  "@ninetailed/experience.js-plugin-ssr",
  "@ninetailed/experience.js-plugin-privacy",
  "@ninetailed/experience.js-node",
];

const OPTIMIZATION_PACKAGES = [
  "@contentful/optimization-web",
  "@contentful/optimization-react-web",
  "@contentful/optimization-node",
  "@contentful/optimization-web-preview-panel",
  "@contentful/optimization-core",
  "@contentful/optimization-api-client",
  "@contentful/optimization-api-schemas",
];

const CONTENTFUL_PACKAGES = [
  "contentful",
  "@contentful/rich-text-react-renderer",
  "@contentful/rich-text-types",
  "contentful-management",
];

const FRAMEWORK_PACKAGES = [
  "next",
  "gatsby",
  "remix",
  "@remix-run/react",
  "react",
  "react-dom",
];

const FW_PREFIX = "(?:NEXT_PUBLIC_|GATSBY_|REACT_APP_|VITE_)?";

const KNOWN_ENV_VARS: Array<{ name: string; patterns: RegExp[] }> = [
  {
    name: "NINETAILED_API_KEY",
    patterns: [
      new RegExp(`^${FW_PREFIX}NINETAILED_API_KEY\\s*=[^\\S\\n]*(.+)`, "m"),
      new RegExp(`^${FW_PREFIX}NINETAILED_CLIENT_ID\\s*=[^\\S\\n]*(.+)`, "m"),
    ],
  },
  {
    name: "NINETAILED_ENVIRONMENT",
    patterns: [
      new RegExp(`^${FW_PREFIX}NINETAILED_ENVIRONMENT\\s*=[^\\S\\n]*(.+)`, "m"),
    ],
  },
  {
    name: "CONTENTFUL_SPACE_ID",
    patterns: [
      new RegExp(`^${FW_PREFIX}CONTENTFUL_SPACE_ID\\s*=[^\\S\\n]*(.+)`, "m"),
    ],
  },
  {
    name: "CONTENTFUL_ACCESS_TOKEN",
    patterns: [
      new RegExp(
        `^${FW_PREFIX}CONTENTFUL_ACCESS_TOKEN\\s*=[^\\S\\n]*(.+)`,
        "m",
      ),
      new RegExp(`^${FW_PREFIX}CONTENTFUL_TOKEN\\s*=[^\\S\\n]*(.+)`, "m"),
      new RegExp(
        `^${FW_PREFIX}CONTENTFUL_DELIVERY_TOKEN\\s*=[^\\S\\n]*(.+)`,
        "m",
      ),
    ],
  },
  {
    name: "CONTENTFUL_PREVIEW_TOKEN",
    patterns: [
      new RegExp(
        `^${FW_PREFIX}CONTENTFUL_PREVIEW_TOKEN\\s*=[^\\S\\n]*(.+)`,
        "m",
      ),
      new RegExp(
        `^${FW_PREFIX}CONTENTFUL_PREVIEW_ACCESS_TOKEN\\s*=[^\\S\\n]*(.+)`,
        "m",
      ),
    ],
  },
  {
    name: "CONTENTFUL_ENVIRONMENT",
    patterns: [
      new RegExp(`^${FW_PREFIX}CONTENTFUL_ENVIRONMENT\\s*=[^\\S\\n]*(.+)`, "m"),
    ],
  },
];

function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return value.slice(0, 8) + "****";
}

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

async function detectPackageManager(
  root: string,
): Promise<"pnpm" | "yarn" | "bun" | "npm" | "unknown"> {
  const checks: Array<[string, "pnpm" | "yarn" | "bun" | "npm"]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];
  for (const [file, pm] of checks) {
    try {
      await access(join(root, file));
      return pm;
    } catch {
      /* continue */
    }
  }
  return "unknown";
}

export const checkPackagesAndEnv = action({
  name: "check-packages-env",
  input: type({ projectPath: "string" }),
  output: PackagesAndEnvResult,
  run: async ({ input }) => {
    const root = input.projectPath;

    // Parse package.json
    const pkgContent = await readFileSafe(join(root, "package.json"));
    const allDeps: Record<string, string> = {};
    if (pkgContent) {
      try {
        const pkg = JSON.parse(pkgContent);
        Object.assign(allDeps, pkg.dependencies, pkg.devDependencies);
      } catch {
        /* invalid JSON */
      }
    }

    const findPackages = (names: string[]): PackageInfo[] =>
      names
        .filter((name) => allDeps[name])
        .map((name) => ({ name, version: allDeps[name] }));

    // Scan env files
    let envEntries: string[] = [];
    try {
      const dirEntries = await readdir(root);
      envEntries = dirEntries.filter((f) => f.startsWith(".env"));
    } catch {
      /* no directory access */
    }

    let combinedEnv = "";
    for (const entry of envEntries) {
      const content = await readFileSafe(join(root, entry));
      if (content) combinedEnv += "\n" + content;
    }

    const envVars: EnvVarInfo[] = [];
    let apiKey: string | undefined;
    let environment: string | undefined;
    let contentfulSpaceId: string | undefined;
    let contentfulAccessToken: string | undefined;
    let contentfulPreviewToken: string | undefined;
    let contentfulEnvironment: string | undefined;

    for (const { name, patterns } of KNOWN_ENV_VARS) {
      let found = false;
      for (const pattern of patterns) {
        const match = combinedEnv.match(pattern);
        if (match) {
          const value = match[1].trim().replace(/^["']|["']$/g, "");
          if (!value) {
            envVars.push({ name, status: "empty" });
          } else {
            envVars.push({
              name,
              status: "set",
              maskedValue: maskValue(value),
            });
            if (name === "NINETAILED_API_KEY") apiKey = value;
            if (name === "NINETAILED_ENVIRONMENT") environment = value;
            if (name === "CONTENTFUL_SPACE_ID") contentfulSpaceId = value;
            if (name === "CONTENTFUL_ACCESS_TOKEN")
              contentfulAccessToken = value;
            if (name === "CONTENTFUL_PREVIEW_TOKEN")
              contentfulPreviewToken = value;
            if (name === "CONTENTFUL_ENVIRONMENT")
              contentfulEnvironment = value;
          }
          found = true;
          break;
        }
      }
      if (!found) {
        envVars.push({ name, status: "missing" });
      }
    }

    const packageManager = await detectPackageManager(root);

    return {
      packages: {
        ninetailed: findPackages(NINETAILED_PACKAGES),
        optimization: findPackages(OPTIMIZATION_PACKAGES),
        contentful: findPackages(CONTENTFUL_PACKAGES),
        framework: findPackages(FRAMEWORK_PACKAGES),
      },
      envVars,
      packageManager,
      apiKey,
      environment,
      contentfulSpaceId,
      contentfulAccessToken,
      contentfulPreviewToken,
      contentfulEnvironment,
    };
  },
});
