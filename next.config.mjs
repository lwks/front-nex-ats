/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    const corsHeaders = [
      {
        key: "Access-Control-Allow-Origin",
        value: "*",
      },
      {
        key: "Access-Control-Allow-Methods",
        value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      },
      {
        key: "Access-Control-Allow-Headers",
        value: "Content-Type, Authorization",
      },
    ]

    return [
      {
        source: "/api/:path*",
        headers: corsHeaders,
      },
    ]
  },
}

export default nextConfig
