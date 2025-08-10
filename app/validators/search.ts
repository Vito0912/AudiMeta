import { cacheValidation, regionValidation } from '#validators/common'

import vine from '@vinejs/vine'

export const stringValidation = vine
  .string()
  .parse((v) => {
    if (v === undefined || v === null) return v
    if (typeof v !== 'string') return v

    let result = v

    const pairRegex = /\[[^\[\]]*]/g
    while (pairRegex.test(result)) {
      result = result.replace(pairRegex, '')
    }

    result = result.replace(/\[.*$/, '')

    result = result.replace(/]/g, '')

    return result
  })
  .optional()

export const basicSearchValidator = vine.compile(
  vine.object({
    author: stringValidation,
    keywords: stringValidation,
    narrator: stringValidation,
    publisher: stringValidation,
    title: stringValidation,
    region: regionValidation,
    query: stringValidation,
    limit: vine
      .number()
      .parse((v) => {
        if (!v) {
          return 10
        }
        if (typeof v !== 'number') {
          return v
        }
        return v
      })
      .min(1)
      .max(50)
      .optional(),
    page: vine
      .number()
      .parse((v) => {
        if (!v) {
          return 0
        }
        if (typeof v !== 'number') {
          return v
        }
        return v
      })
      .max(9)
      .min(0)
      .optional(),
    products_sort_by: vine
      .enum([
        '-ReleaseDate',
        'ContentLevel',
        '-Title',
        'AmazonEnglish',
        'AvgRating',
        'BestSellers',
        '-RuntimeLength',
        'ReleaseDate',
        'ProductSiteLaunchDate',
        '-ContentLevel',
        'Title',
        'Relevance',
        'RuntimeLength',
      ])
      .parse((v) => {
        if (!v) {
          return 'Relevance'
        }
        if (typeof v !== 'string') {
          return v
        }
        return v
      }),
    cache: cacheValidation,
  })
)

export const dbBookSearchValidator = vine.compile(
  vine.object({
    title: stringValidation.optional(),
    subtitle: stringValidation.optional(),
    region: vine
      .enum(['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'])
      .optional(),
    description: stringValidation.optional(),
    summary: stringValidation.optional(),
    publisher: stringValidation.optional(),
    copyright: stringValidation.optional(),
    isbn: stringValidation.optional(),
    language: stringValidation.optional(),
    rating_better_than: vine.number().optional(),
    rating_worse_than: vine.number().optional(),
    longer_than: vine.number().optional(),
    shorter_than: vine.number().optional(),
    explicit: vine.boolean().optional(),
    whisper_sync: vine.boolean().optional(),
    has_pdf: vine.boolean().optional(),
    book_format: vine
      .enum(['unabridged', 'abridged', 'original_recording', 'highlights'])
      .optional(),
    content_type: vine
      .enum([
        'Article',
        'Book',
        'Episode',
        'Excerpt',
        'Hypnosis',
        'Language Learning',
        'Lecture',
        'Meditation',
        'Misc',
        'Newspaper / Magazine',
        'Performance',
        'Periodical',
        'Podcast',
        'Product',
        'Radio/TV Program',
        'Sermon',
        'Show',
        'Speech',
        'Walking Tour',
      ])
      .optional(),
    content_delivery_type: vine
      .enum([
        'AudioPart',
        'BookSeries',
        'Bundle',
        'MultiPartBook',
        'Periodical',
        'PodcastEpisode',
        'PodcastParent',
        'PodcastSeason',
        'SinglePartBook',
        'SinglePartIssue',
        'Subscription',
      ])
      .optional(),
    is_listenable: vine.boolean().optional(),
    is_buyable: vine.boolean().optional(),
    limit: vine
      .number()
      .parse((v) => {
        if (!v) {
          return 20
        }
        if (typeof v !== 'number') {
          return v
        }
        return v
      })
      .min(1)
      .max(50)
      .optional(),
    page: vine
      .number()
      .parse((v) => {
        if (!v) {
          return 1
        }
        if (typeof v !== 'number') {
          return v
        }
        return v
      })
      .max(20)
      .min(1),
  })
)
