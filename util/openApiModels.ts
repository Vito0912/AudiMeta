const regionEnum = {enum: ['US', 'UK', 'AU', 'DE', 'FR', 'CA', 'IT', 'JP', 'IN', 'BR', 'MX', 'ES']};

export const oaGenre = {
    asin: { type: 'string', required: true, description: 'The genre asin' },
    name: { type: 'string', required: true, description: 'The name of the genre' },
    type: { type: 'string', required: true, description: 'The type of the genre', enum: ['Genres', 'Tags'] }
};

export const oaAuthor = {
    asin: { type: 'string', required: true, description: 'The author asin. Can be the authors name!' },
    region: { type: 'string', required: true, description: 'The language of the authors description', ...regionEnum },
    name: { type: 'string', required: true, description: 'The name of the author' },
    description: { type: 'string', description: 'The description of the author' },
    image: { type: 'string', description: 'The image of the author. 512x512 resolution' },
    genres: { type: 'array', items: oaGenre, description: 'The genres of the author' }
}

export const oaSeries = {
    asin: { type: 'string', required: true, description: 'The series asin' },
    name: { type: 'string', required: true, description: 'The name of the series' },
    description: { type: 'string', description: 'The description of the series' },
    position: { type: 'number', description: 'The position of the series' },
}

export const oaNarrator = {
    name: { type: 'string', required: true, description: 'The name of the narrator' }
}

export const oaChapter = {
    asin: { type: 'string', required: true, description: 'The books asin' },
    chapters: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                title: { type: 'string', required: true, description: 'The title of the chapter' },
                lengthMs: { type: 'number', required: true, description: 'The length of the chapter in milliseconds' },
                startOffsetMs: { type: 'number', required: true, description: 'The start offset of the chapter in milliseconds' },
                startOffsetSec: { type: 'number', required: true, description: 'The start offset of the chapter in seconds' }
            }
        },
        isAccurate: { type: 'boolean', required: true},
        runtimeLengthMs: { type: 'number', description: 'The runtime length of the chapter in milliseconds', required: true },
        runtimeLengthSec: { type: 'number', description: 'The runtime length of the chapter in seconds', required: true}
    }
}

export const oaBook = {
    asin: { type: 'string', required: true, description: 'The books asin' },
    title: { type: 'string', required: true, description: 'The title of the book' },
    regions: { type: 'array', items: { type: 'string', ...regionEnum }, description: 'The regions the book is available in' },

    copyrigth: { type: 'string', description: 'The copyrigth of the book' },
    description: { type: 'string', description: 'The description of the book' },
    summary: { type: 'string', description: 'The summary of the book' },
    explicit: { type: 'boolean', description: 'The explicit content of the book' },
    isbn: { type: 'string', description: 'The isbn of the book' },
    language: { type: 'string', description: 'The language of the book' },
    publisher: { type: 'string', description: 'The publisher of the book' },

    rating: { type: 'number', description: 'The rating of the book' },

    series: { type: 'array', items: oaSeries, description: 'The series of the book' },
    authors: { type: 'array', items: oaAuthor, description: 'The authors of the book' },
    narrators: { type: 'array', items: oaNarrator, description: 'The narrators of the book' },
    genres: { type: 'array', items: oaGenre, description: 'The genres of the book' },

    releaseDate: { type: 'string', description: 'The release date of the book' },
};

export const oaRegion = {
    name: 'region',
    in: 'query',
    description: 'The region to search in',
    required: true,
    schema: {
        ...regionEnum
    }
};

export const oaAsinPath = {
    name: 'asin',
    in: 'path',
    description: 'The asin of the series',
    required: true,
    schema: {
        type: 'string'
    }
}

export const oaAsinQuery = {
    name: 'asins',
    in: 'query',
    description: 'The asins of the book in a comma separated list',
    required: true,
    schema: {
        type: 'string'
    }
}