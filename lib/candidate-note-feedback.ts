export function shouldClearCandidateNoteFeedback(
  previousCandidateId: string | null,
  currentCandidateId: string | null,
) {
  return previousCandidateId !== currentCandidateId
}
