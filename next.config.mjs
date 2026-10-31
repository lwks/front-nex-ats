if (process.env.HARNESS_MODE === 'local') {
  if (process.env.NODE_ENV !== 'development' || process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    throw new Error('Local harness cannot be built or served in production/hosted runtimes')
  }
  for (const name of ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']) {
    const url = new URL(process.env[name] || '')
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error(`Invalid local URL: ${name}`)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
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
