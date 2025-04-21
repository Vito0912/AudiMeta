import { Infer } from '@vinejs/vine/types'
import { authorBookValidator, getAuthorsValidator, searchAuthorValidator } from '#validators/common'
import Author from '#models/author'
import axios from 'axios'
import { audibleHeaders, getAudibleExtraHeaders, regionMap } from '#config/app'
import { AudibleHelper } from './audible.js'
import { HttpContext } from '@adonisjs/core/http'
import NotFoundException from '#exceptions/not_found_exception'
import { BookHelper } from './book.js'
import Book from '#models/book'
import { DateTime } from 'luxon'

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

  private static async getAuthorPage(
    payload: Infer<typeof getAuthorsValidator>,
    token?: string | null
  ) {
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
          pageSectionContinuationToken: token,
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
        author.image = section.model.person_image_url.replace(/\._.*_/, '')
      }
      for (const item of section.model.items || []) {
        if (item.view.template === 'ExpandableText' && item.model.expandable_content) {
          author.description = item.model.expandable_content.value
        }
      }
      author.noDescription = true
    }
    if (json.page_details?.model?.title) {
      author.name = json.page_details.model.title
    }
    if (!author.region) {
      author.region = payload.region
    }
    author.asin = payload.asin

    return await author.save()
  }

  static async getBooksByAuthor(
    payload: Infer<typeof authorBookValidator>
  ): Promise<Book[] | null> {
    let author = await Author.query().where('asin', payload.asin).first()

    if (!author) {
      author = await AuthorHelper.fetchFromAudible({ ...payload })
    }

    if (!author) {
      throw new NotFoundException()
    }

    const asins: string[] = []
    let paginationToken: string | null = null
    let page: number = 0
    let firstRun: boolean = true

    const startTime = DateTime.now()
    const ctx = HttpContext.get()

    while ((firstRun || paginationToken) && page <= 10) {
      firstRun = false
      const authorResponse = await AuthorHelper.getAuthorPage(payload, paginationToken)

      if (authorResponse.data) {
        let found = false
        for (const section of authorResponse.data.sections) {
          if (section?.model?.rows) {
            found = true
            for (const item of section.model.rows) {
              if (item.product_metadata && item.product_metadata.asin) {
                asins.push(item.product_metadata.asin)
              }
            }
          }
          if (found) {
            paginationToken = section.pagination
            break
          }
        }
      }
      page++
    }

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author Books`,
        author_book_num: asins.length,
        author_book_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    if (asins.length === 0) {
      throw new NotFoundException()
    }

    return await new BookHelper().getOrFetchBooks(asins, payload.region, true)
  }

  static async search(payload: Infer<typeof searchAuthorValidator>) {
    const ctx = HttpContext.get()

    const startTime = DateTime.now()

    const response = await axios.get(
      `https://api.audible${regionMap[payload.region]}/1.0/searchsuggestions`,
      {
        headers: { ...getAudibleExtraHeaders(), ...audibleHeaders },
        params: {
          keywords: payload.name,
          key_strokes: payload.name,
          site_variant: 'android-mshop',
          session_id: AudibleHelper.generateRandomSessionId(),
          local_time: new Date().toISOString(),
          surface: 'Android',
        },
      }
    )

    if (ctx)
      void ctx.logger.info({
        message: `Requested Audible Author Search`,
        search_took: Math.abs(startTime.diffNow().as('milliseconds')),
      })

    const asins: string[] = []

    if (response.status === 200) {
      const json = response.data

      if (json) {
        const items = json.model.items
        for (const item of items) {
          if (item.view?.template && item.view?.template === 'AuthorItemV2') {
            if (item.model?.person_metadata?.asin) {
              asins.push(item.model.person_metadata.asin)
            }
          }
        }
      }

      if (asins.length === 0) {
        return []
      }

      return await Promise.all(
        asins.map(async (asin) => {
          const author = await AuthorHelper.get({
            asin: asin,
            region: payload.region,
            cache: true,
          })
          return author || null
        })
      ).then((results) => results.filter((author) => author !== null))
    }
  }
}
