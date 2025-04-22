import vine from '@vinejs/vine'
import { cacheValidation, regionValidation } from '#validators/common'

export const basicSearchValidator = vine.compile(
  vine.object({
    author: vine.string().optional(),
    keywords: vine.string().optional(),
    narrator: vine.string().optional(),
    publisher: vine.string().optional(),
    title: vine.string().optional(),
    region: regionValidation,
    query: vine.string().optional(),
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
