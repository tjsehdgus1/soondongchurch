import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    turbopack: {
        resolveAlias: {
            canvas: path.resolve('./src/lib/empty-module.js'),
        },
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false
        return config
    },
}

export default nextConfig;
