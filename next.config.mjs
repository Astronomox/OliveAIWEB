/** @type {import('next').NextConfig} */
const nextConfig = {
    /* Enable React strict mode for development best practices */
    reactStrictMode: true,

    /* Image optimization: allow placeholder domains */
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },

    /* API Proxy to fix CORS during development */
    async rewrites() {
        return [
            {
                source: '/api/proxy/:path*',
                destination: 'https://olive-backend-bly2.onrender.com/api/:path*',
            },
        ];
    },

    /* Custom headers for PWA and security */
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Service-Worker-Allowed",
                        value: "/",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
