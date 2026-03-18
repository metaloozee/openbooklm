import "@openbooklm/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["@openbooklm/api", "@openbooklm/auth", "@openbooklm/env", "@openbooklm/ui"],
};

export default nextConfig;
