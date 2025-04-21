import { Infer } from '@vinejs/vine/types'
import { getAuthorsValidator, pageValidator } from '#validators/common'
import Author from '#models/author'
import axios from 'axios'
import { audibleHeaders, getAudibleExtraHeaders, regionMap } from '#config/app'
import { AudibleHelper } from './audible.js'
import { HttpContext } from '@adonisjs/core/http'
import NotFoundException from '#exceptions/not_found_exception'
import { BookHelper } from './book.js'
import Book from '#models/book'

export class AuthorHelper {
  static async get(payload: Infer<typeof getAuthorsValidator>) {
    let authors = await Author.query().where('asin', payload.asin)

    const region = payload.region
    // Sort authors so the requested region is first
    authors = authors.sort((a) => {
      if (a.regions.includes(region)) {
        return -1
      }
      return 1
    })

    let author: Author | null = null

    if (authors.length > 0) {
      author = authors[0]
    }

    if (
      !payload.cache ||
      !author ||
      author.region !== payload.region ||
      ((!author.description || author.image) && !author.noDescription)
    ) {
      const newAuthor = await AuthorHelper.fetchFromAudible(payload, author)
      if (newAuthor) {
        author = newAuthor
      }
    }

    return author
  }

  private static async getAuthorPage(payload: Infer<typeof getAuthorsValidator>) {
    // The region is not important for authors.
    // Only the language is actually important
    // Still, as it's simple to do, we keep the region here. Also for legacy reasons
    return await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/screens/audible-android-author-detail/` +
        payload.asin,
      {
        headers: { ...getAudibleExtraHeaders(), ...audibleHeaders },
        params: {
          tabId: 'titles',
          author_asin: payload.asin,
          title_source: 'all',
          session_id: AudibleHelper.generateRandomSessionId(),
          applicationType: 'Android_App',
          local_time: new Date().toISOString(),
          response_groups: 'always-returned',
          surface: 'Android',
          language: 'de-DE',
        },
      }
    )
  }

  private static async fetchFromAudible(
    payload: Infer<typeof getAuthorsValidator>,
    author?: Author | null
  ) {
    const startTime = new Date()
    const ctx = HttpContext.get()

    const response = await AuthorHelper.getAuthorPage(payload)

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author`,
        author_took: Math.abs(startTime.getTime() - new Date().getTime()),
      })

    if (!author) author = new Author()

    if (response.status === 200) {
      const json: any = response.data
      if (!json) {
        return null
      }

      return await AuthorHelper.saveResponse(json, payload, author)
    }

    return null
  }

  private static async saveResponse(
    json: any,
    payload: Infer<typeof getAuthorsValidator>,
    author: Author
  ) {
    const sections = json.sections
    for (const section of sections) {
      if (section?.model?.person_image_url) {
        author.image = section.model.person_image_url
      }
      for (const item of section.model.items || []) {
        if (item.view.template === 'ExpandableText' && item.model.expandable_content) {
          author.description = item.model.expandable_content.value
        }
      }
    }
    if (json.page_details?.model?.title) {
      author.name = json.page_details.model.title
    }
    if (!author.region) {
      author.region = payload.region
    }
    author.noDescription = true
    author.asin = payload.asin

    return await author.save()
  }

  static async getBooksByAuthor(payload: Infer<typeof pageValidator>): Promise<Book[] | null> {
    let author = await Author.query().where('asin', payload.asin).first()

    if (!author) {
      author = await AuthorHelper.fetchFromAudible({ ...payload })
    }

    if (!author) {
      throw new NotFoundException()
    }

    const authorResponse = await AuthorHelper.getAuthorPage(payload)

    const asins: string[] = []

    if (authorResponse.data) {
      for (const section of authorResponse.data.sections) {
        if (section?.model?.rows) {
          for (const item of section.model.rows) {
            if (item.product_metadata && item.product_metadata.asin) {
              asins.push(item.product_metadata.asin)
            }
          }
        }
      }
    }

    if (asins.length === 0) {
      throw new NotFoundException()
    }
<
    console.log(asins.length)

    const response = await axios.get(
      // @ts-ignore
      `https://api.audible${regionMap[payload.region]}/1.0/catalog/products/` + asins[0] + '/sims',
      {
        headers: { ...getAudibleExtraHeaders(), ...audibleHeaders },
        params: {
          similarity_type: 'ByTheSameAuthor',
          num_results: payload.limit ?? 10,
          page: payload.page ?? 0,
          response_groups:
            'media, product_attrs, product_desc, product_details, product_extended_attrs, product_plans, rating, series, relationships, review_attrs, category_ladders',
        },
      }
    )

    if (response.status === 200) {
      const books = response.data.similar_products
      if (books.length === 0) {
        throw new NotFoundException()
      }
      const bookAsins = books.map((book: any) => book.asin)

      return await new BookHelper().getOrFetchBooks(bookAsins, payload.region, payload.cache)
    }
    return null
  }
}
