import { candidateProxy } from '@/lib/candidate-proxy'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) { return candidateProxy(request, '/me/cv-download', 'GET') }
