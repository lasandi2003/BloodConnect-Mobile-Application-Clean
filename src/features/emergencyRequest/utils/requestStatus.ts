export function getRequestStatusView(status: string, verified: boolean) {
  const normalized = status.trim().toLowerCase();
  if (['cancelled', 'rejected', 'closed'].includes(normalized)) {
    return { label: normalized[0].toUpperCase() + normalized.slice(1),
      description: 'This request is no longer active.', stage: null, terminal: true };
  }
  if (['completed', 'fulfilled'].includes(normalized)) {
    return { label: 'Completed', description: 'This request has been marked as fulfilled.', stage: 4, terminal: true };
  }
  if (['matched', 'donor_found'].includes(normalized)) {
    return { label: 'Donor Matched', description: 'A donor match has been recorded. Fulfilment is still pending.', stage: 3, terminal: false };
  }
  if (['verified', 'approved', 'matching', 'donor_matching'].includes(normalized)
    || (verified && ['pending_verification', 'pending', 'open'].includes(normalized))) {
    return { label: 'Verified', description: 'Healthcare verification is complete. Donor matching is pending or in progress.', stage: 2, terminal: false };
  }
  if (['pending_verification', 'pending', 'open'].includes(normalized)) {
    return { label: 'Pending Verification', description: 'Your request is awaiting healthcare verification.', stage: 1, terminal: false };
  }
  return { label: status.replace(/_/g, ' '), description: 'The saved status is shown above. No further progress has been confirmed.', stage: null, terminal: false };
}
