import { notFound } from 'next/navigation'
import { PublicJobDetailPage } from '@/components/public-job-detail-page'
import { guidFromSharedJobCode } from '@/lib/job-share'

export default async function SharedJobPage({ params }: { params: Promise<{ guid: string }> }) {
  const { guid: code } = await params
  const guid = guidFromSharedJobCode(code)
  if (!guid) notFound()
  return <PublicJobDetailPage guid={guid} />
}
