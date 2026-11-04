import { candidateProxy } from '@/lib/candidate-proxy'
export const dynamic = 'force-dynamic'
export async function POST(request: Request) { return candidateProxy(request, '/applications', 'POST') }
