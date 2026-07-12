// Server-only by convention. The file reads process.env, which is only
// populated in server runtimes; Next's tree-shaking also drops the module
// from client bundles because no client component imports it directly.
// We deliberately avoid `import "server-only"` here so that type-only
// imports elsewhere don't trip Vercel's stricter server/client boundary
// checker at build time.

export const SECRET_NAMES = {
  gemini: "GEMINI_API_KEY",
} as const;

function readSecret(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  
  // Detect placeholders and ignore them
  const isPlaceholder =
    value === "" ||
    value === "your_gemini_api_key_here" ||
    value === "your_database_url_here" ||
    value.startsWith("your_");

  if (isPlaceholder) return undefined;
  return value;
}

export const serverKeys = {
  get geminiApiKey() {
    return readSecret(SECRET_NAMES.gemini);
  },
};

export function getServerServiceStatus() {
  return {
    geminiConfigured: Boolean(serverKeys.geminiApiKey),
  };
}
