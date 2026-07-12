import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Firebase's signInWithPopup needs to read the popup window's closed
        // state and communicate back to this origin. Some default security
        // header sets (and Next.js's own defaults on newer versions) apply a
        // strict Cross-Origin-Opener-Policy that makes the popup look like it
        // "opens and immediately closes". This header explicitly allows that
        // popup flow to work while keeping the rest of COOP protection.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
