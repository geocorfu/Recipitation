/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Restoring a full export goes through a server action in one go.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // The Add page reads the Claude instructions from this file at request time.
  outputFileTracingIncludes: {
    "/recipes/new": ["./claude-project-instructions.md"],
  },
};

export default nextConfig;
