import { defineConfig } from '@foadonis/openapi'
import {
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiResponseOptions,
  ApiParam,
} from '@foadonis/openapi/decorators'

export default defineConfig({
  ui: 'swagger',
  document: {
    info: {
      title: 'AudiMeta',
      version: process.env.npm_package_version || '1.0.0',
      contact: {
        name: 'Vito0912',
        url: 'https://github.com/Vito0912/AudiMeta',
      },
      termsOfService: 'https://github.com/Vito0912/AudiMeta/blob/v2/PRIVACYPOLICY.md',
      description:
        'AudiMeta API is a free and simple REST API that lets you get audiobook information from Audible. You can search for books and authors, find series, and get details like descriptions and chapters - all taken straight from Audible.\n' +
        '\n' +
        'Key Features:\n' +
        '\n' +
        '- Books: Get detailed information for any audiobook, or find details for several titles at once.\n' +
        '- Authors: Find author profiles, see all their books, and look through their list of works.\n' +
        '- Series: Explore audiobook series and see every title in a series.\n' +
        '- Chapters: Get chapter information for each audiobook that has chapters.\n' +
        '- Search: Quick and reliable search for books or authors, using Audible’s catalog.\n' +
        '\n' +
        'Note: AudiMeta never scrapes HTML data. Everything comes directly from Audible’s publicly accessible API information, including descriptions and author search, to make sure the metadata is current and reliable. This means there is currently no way to search for series using the Audible API.',
    },
    servers: [
      {
        url: 'https://audimeta.de',
        description: 'Public Instance',
      },
      {
        url: 'https://beta.audimeta.de',
        description: 'Beta Instance',
      },
    ],
  },
})

export const asinApiProperty = () =>
  ApiProperty({
    description:
      'The ASIN (Amazon Standard Identification Number) is a unique identifier for products on Amazon.',
    type: 'string',
    example: 'B019NODM94',
    nullable: false,
    pattern: '^[A-Z0-9]{10}$',
  })

export const genreAsinApiProperty = () =>
  ApiProperty({
    description:
      'The ASIN (Amazon Standard Identification Number) of the genres. This is used to uniquely identify the author on Amazon. It has a different format than the ASIN of products/series.',
    type: 'string',
    example: 'B019NODM94',
    nullable: false,
    pattern: '^[A-Z0-9]{10}$',
  })

export const imageApiProperty = () =>
  ApiProperty({
    description: 'The URL of the image.',
    type: 'string',
    format: 'uri',
    example: 'https://m.media-amazon.com/images/I/51XILuCtg9L.jpg',
    nullable: true,
  })

export const updatedAtApiProperty = () =>
  ApiProperty({
    description:
      'The date and time when the resource was last updated. Can be used to determine if the resource should be refreshed.',
    type: 'string',
    format: 'date-time',
    example: '2023-10-01T12:00:00Z',
    nullable: true,
  })

export const descriptionApiProperty = () =>
  ApiProperty({
    description: 'The description of the resource.',
    type: 'string',
    example: 'This is a sample description.',
    nullable: true,
  })

export const nameApiProperty = () =>
  ApiProperty({
    description: 'The name of the resource.',
    type: 'string',
    example: 'Sample Name',
    nullable: true,
  })

// ApiQuery

export const regionApiQuery = (required: boolean = true) =>
  ApiQuery({
    name: 'region',
    description: 'The region to use for the request. Defaults to "us".',
    type: 'string',
    example: 'us',
    required: required,
    // 'us' | 'ca' | 'uk' | 'au' | 'fr' | 'de' | 'jp' | 'it' | 'in' | 'es' | 'br'
    schema: {
      type: 'string',
      enum: ['us', 'ca', 'uk', 'au', 'fr', 'de', 'jp', 'it', 'in', 'es', 'br'],
      default: 'us',
    },
  })

export const asinApiQuery = (required: boolean = true) =>
  ApiParam({
    name: 'asin',
    description: 'The ASIN (Amazon Standard Identification Number) of the resource.',
    type: 'string',
    example: 'B019NODM94',
    required: required,
    schema: {
      type: 'string',
      pattern: '^[A-Z0-9]{10}$',
    },
  })

export const cacheApiQuery = (required: boolean = false) =>
  ApiQuery({
    name: 'cache',
    description:
      'Whether to use the cache for the request. Defaults to true. If set to false, the cache will be bypassed. This will lower the amount of requests you can make in the current time window.',
    type: 'boolean',
    example: true,
    required: required,
    schema: {
      type: 'boolean',
      default: true,
    },
  })

export const nameApiQuery = (required: boolean = false) =>
  ApiQuery({
    name: 'name',
    description: 'The name of the resource to search for.',
    type: 'string',
    example: 'Sample Name',
    required: required,
  })

export const pageApiQuery = (required: boolean = false) =>
  ApiQuery({
    name: 'page',
    description: 'The page number to return. Defaults to 1.',
    type: 'integer',
    example: 1,
    required: required,
    schema: {
      type: 'integer',
      default: 1,
      minimum: 1,
    },
  })

export const limitApiQuery = (required: boolean = false) =>
  ApiQuery({
    name: 'limit',
    description: 'The maximum number of items to return per page. Defaults to 10. Maximum is 50.',
    type: 'integer',
    example: 10,
    required: required,
    schema: {
      type: 'integer',
      default: 10,
      minimum: 1,
      maximum: 50,
    },
  })

// Rate Limit Headers

const rateLimitHeaders = {
  'x-ratelimit-limit': {
    description: 'The maximum number of requests you can make in the current time window.',
    schema: {
      type: 'integer',
      example: 100,
    },
  },
  'x-ratelimit-remaining': {
    description: 'The number of requests you have left in the current time window.',
    schema: {
      type: 'integer',
      example: 100,
    },
  },
  'x-cached': {
    description: 'Indicates whether the response was served from cache.',
    schema: {
      type: 'boolean',
      example: true,
    },
  },
}

// Responses

export const successApiResponse = (options: ApiResponseOptions) =>
  ApiResponse({
    // @ts-ignore
    headers: { ...rateLimitHeaders },
    status: 200,
    description: 'Success',
    ...options,
  })

export const notFoundApiResponse = () =>
  ApiResponse({
    // @ts-ignore
    headers: { ...rateLimitHeaders },
    status: 404,
    description: 'Resource not found',
    mediaType: 'application/json',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Resource not found',
        },
        requestId: {
          type: 'string',
          example: 'sbq3l6jl0a2fpqnkydlwl9mu',
          description:
            'The unique identifier for the request. If you have any issues, please provide this ID to us.',
        },
      },
    },
  })
