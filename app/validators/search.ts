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
