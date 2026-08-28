import type { ProReviewSubmission } from '../lib/proLabReviewIntake'

/**
 * Checked-in production evidence enters Pro Lab here only after direct gameplay
 * review. The evidence registry validates every submission again at build time;
 * invalid records fail closed and are never promoted into lessons, exercises,
 * matchup patterns, player comparisons, or reviewed VOD status.
 *
 * The browser workbench exports this exact ProReviewSubmission shape. Keep this
 * list empty rather than inventing tactical observations when footage has not
 * actually been reviewed.
 */
export const proReviewedSubmissions: readonly ProReviewSubmission[] = []
