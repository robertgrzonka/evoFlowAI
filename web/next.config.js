/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'api.evoflowai.app'],
        formats: ['image/webp', 'image/avif'],
    },
    env: {
        CUSTOM_KEY: 'evoflowai-web',
    },
    // PWA configuration for mobile-like experience
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
    // Webpack configuration for better performance
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            config.optimization.splitChunks.chunks = 'all';
        }
        return config;
    },
};

module.exports = nextConfig;
