import vine from '@vinejs/vine'
import { regionMap } from '#config/app'

export const pageValidation = vine
  .number()
  .positive()
  .withoutDecimals()
  .min(1)
  .max(10)
  .optional()
  .transform((val) => val || 1)

export const limitValidation = vine
  .number()
  .positive()
  .withoutDecimals()
  .min(1)
  .max(50)
  .optional()
  .transform((val) => val || 10)

export const regionValidation = vine
  .enum([
    'us',
    'ca',
    'uk',
    'au',
    'fr',
    'de',
    'jp',
    'it',
    'in',
    'es',
    'br',
    'US',
    'CA',
    'UK',
    'AU',
    'FR',
    'DE',
    'JP',
    'IT',
    'IN',
    'ES',
    'BR',
  ])
  .parse((v) => {
    if (!v) {
      return 'us'
    }
    if (typeof v !== 'string') {
      return v
    }
    return v
  })
  .optional()
  // @ts-ignore
  .transform((val): keyof typeof regionMap => (val && val.length > 0 ? val.toLowerCase() : 'us'))

export const asinValidation = vine.string().regex(/^[A-Z0-9]{10}|[0-9]{10,12}$/)

export const cacheValidation = vine
  .boolean()
  .parse((v) => {
    if (v === undefined) {
      return true
    }
    if (typeof v !== 'boolean') {
      return v
    }
    return v
  })
  .optional()
  .transform((val) => (val !== undefined ? val : true))

export const commonValidator = vine.object({
  page: pageValidation,
  limit: limitValidation,
  region: regionValidation,
})

export const getBooksValidator = vine.compile(
  vine.object({
    region: regionValidation,
    asins: vine
      .array(asinValidation)
      .parse((v) => {
        if (v === undefined || v === null) return v
        if (typeof v !== 'object') return [v]
        if (!Array.isArray(v)) return [v]

        return v
      })
      .compact()
      .maxLength(50)
      .distinct()
      .optional()
      .requiredIfMissing('asin'),
    asin: asinValidation.optional().requiredIfMissing('asins'),
    cache: cacheValidation,
  })
)

export const getBasicValidator = vine.compile(
  vine.object({
    region: regionValidation,
    asin: asinValidation,
    cache: cacheValidation,
  })
)

export const getSeriesValidator = vine.compile(
  vine.object({
    region: regionValidation,
    asin: asinValidation,
    cache: cacheValidation,
  })
)

export const paginationValidator = vine.compile(
  vine.object({
    asin: asinValidation,
    page: pageValidation,
    limit: limitValidation,
    region: regionValidation,
    cache: cacheValidation,
  })
)

export const authorBookValidator = vine.compile(
  vine.object({
    asin: asinValidation,
    region: regionValidation,
    cache: cacheValidation,
  })
)

export const searchAuthorValidator = vine.compile(
  vine.object({
    region: regionValidation,
    name: vine.string().minLength(3),
  })
)

export const searchSeriesValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(3),
  })
)
