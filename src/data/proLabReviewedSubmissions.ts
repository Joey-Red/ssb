/**
 * Checked-in production evidence is stored as one JSON file per reviewed VOD
 * under ./proLabReviews. The ingestion CLI regenerates that index atomically,
 * while the production evidence registry validates every submission again at
 * build time before anything can reach lessons, exercises, matchup patterns,
 * comparisons, coverage, or reviewed VOD status.
 */
export { proReviewedSubmissions } from './proLabReviews/index'
