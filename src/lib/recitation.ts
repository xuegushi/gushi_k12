const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60]

export function getNextReviewDate(stage: number, lastReview: Date): Date {
  const interval = REVIEW_INTERVALS[Math.min(stage, REVIEW_INTERVALS.length - 1)]
  return new Date(lastReview.getTime() + interval * 24 * 60 * 60 * 1000)
}

export function getMaxStage(): number {
  return REVIEW_INTERVALS.length - 1
}
