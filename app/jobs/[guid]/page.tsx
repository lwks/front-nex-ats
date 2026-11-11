import { notFound } from 'next/navigation'
import { PublicJobDetailPage } from '@/components/public-job-detail-page'

export default async function SharedJobPage({ params }: { params: Promise<{ guid: string }> }) {
  const { guid: code } = await params
  const shortCode = code.slice(code.lastIndexOf('-') + 1)
  if (!/^[A-Za-z0-9_-]{22}$/.test(shortCode)) notFound()
  const binary = Buffer.from(shortCode.replaceAll('-', '+').replaceAll('_', '/'), 'base64')
  if (binary.length !== 16) notFound()
  const hex = binary.toString('hex')
  const guid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  return <PublicJobDetailPage guid={guid} />
}
