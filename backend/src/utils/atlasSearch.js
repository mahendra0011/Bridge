/**
 * atlasSearch.js — MongoDB Atlas Full-Text Search Utility
 * ─────────────────────────────────────────────────────────
 * HOW TO ENABLE ATLAS SEARCH:
 *
 * 1. MongoDB Atlas UI → Your Cluster → Search tab → Create Search Index
 *
 * 2. Create index named "default" on each collection:
 *
 *    Collection: jobs
 *    Fields: title (string), description (string), category (string), skills (string)
 *
 *    Collection: internships
 *    Fields: title (string), description (string), category (string), skills (string)
 *
 *    Collection: posts (community)
 *    Fields: description (string), companyName (string), roleTitle (string), tags (string)
 *
 *    Collection: companies
 *    Fields: name (string), industry (string), description (string)
 *
 *    Use "Dynamic Mapping" = true for simplest setup.
 *
 * 3. Add to backend/.env:
 *    ATLAS_SEARCH_ENABLED=true
 *
 * When ATLAS_SEARCH_ENABLED=false (default), falls back to $regex automatically.
 * ─────────────────────────────────────────────────────────
 */

const ATLAS_ENABLED = process.env.ATLAS_SEARCH_ENABLED === 'true'

/**
 * Build compound $search stage with:
 *  - Phrase match (highest boost, exact phrase)
 *  - Fuzzy text match (typo tolerance, 1 edit distance)
 *  - Wildcard prefix (partial match)
 */
function buildAtlasSearchStage(query, paths, indexName = 'default') {
  const pathArr = Array.isArray(paths) ? paths : [paths]
  return {
    $search: {
      index: indexName,
      compound: {
        should: [
          // Exact phrase — highest relevance
          {
            phrase: {
              query,
              path: pathArr,
              score: { boost: { value: 3 } },
            },
          },
          // Fuzzy text — tolerates typos (1 character edit)
          {
            text: {
              query,
              path: pathArr,
              fuzzy: {
                maxEdits: 1,
                prefixLength: 2, // first 2 chars must be exact
              },
            },
          },
        ],
        minimumShouldMatch: 1,
      },
    },
  }
}

/**
 * atlasSearch(Model, query, options) → Promise<Array>
 *
 * Runs Atlas Search if ATLAS_SEARCH_ENABLED=true,
 * otherwise falls back to MongoDB $regex query.
 *
 * @param  {Object} Model        - Mongoose model
 * @param  {string} query        - User search text
 * @param  {Object} options
 * @param  {Array}  options.paths        - Fields to search ['title','description']
 * @param  {Object} options.matchFilter  - Extra $match (e.g. { status: 'approved' })
 * @param  {number} options.limit
 * @param  {number} options.skip
 * @param  {string} options.indexName    - Atlas index name (default: 'default')
 */
async function atlasSearch(Model, query, {
  paths = ['title', 'description'],
  matchFilter = {},
  limit = 10,
  skip = 0,
  indexName = 'default',
} = {}) {
  if (!query || !query.trim()) return []

  // ── Fallback: $regex (local dev, no Atlas index needed) ──────────
  if (!ATLAS_ENABLED) {
    const { escapeRegex } = require('./sanitize')
    const regex = { $regex: escapeRegex(query.trim()), $options: 'i' }
    const pathArr = Array.isArray(paths) ? paths : [paths]
    const filter = {
      ...matchFilter,
      $or: pathArr.map(p => ({ [p]: regex })),
    }
    return Model.find(filter).skip(skip).limit(limit).lean()
  }

  // ── Atlas Search aggregation ──────────────────────────────────────
  const pipeline = [
    // 1. Full-text search
    buildAtlasSearchStage(query.trim(), paths, indexName),

    // 2. Expose relevance score
    { $addFields: { _searchScore: { $meta: 'searchScore' } } },

    // 3. Apply extra filters (status, etc.)
    ...(Object.keys(matchFilter).length ? [{ $match: matchFilter }] : []),

    // 4. Sort by relevance (best match first)
    { $sort: { _searchScore: -1 } },

    // 5. Pagination
    ...(skip > 0 ? [{ $skip: skip }] : []),
    { $limit: limit },
  ]

  return Model.aggregate(pipeline)
}

module.exports = { atlasSearch, buildAtlasSearchStage, ATLAS_ENABLED }
