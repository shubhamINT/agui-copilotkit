import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["@copilotkit/runtime"],
    output: "standalone", // Enable standalone output for Docker
};

export default nextConfig;
