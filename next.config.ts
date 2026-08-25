import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const scriptPolicy = process.env.NODE_ENV === "development" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
const localDevOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", ...localDevOrigins],
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: `default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` },
    ] }];
  },
};

export default nextConfig;
