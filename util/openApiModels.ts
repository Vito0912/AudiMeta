const oaGenre = {
    asin: { type: 'string', required: true },
    name: { type: 'string', required: true },
    type: { type: 'string', required: true }
};

const oaAuthor = {
    asin: { type: 'string', required: true },
    name: { type: 'string', required: true },
    description: { type: 'string' }
}

const oaSeries = {
    seriesAsin: { type: 'string', required: true },
    bookAsin: { type: 'string', required: true },
    position: { type: 'number', required: true },
    series: {
        asin: { type: 'string', required: true },
        title: { type: 'string', required: true },
        description: { type: 'string' }
    }
}

export const oaBook = {
    asin: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    summary: { type: 'string' },
    description: { type: 'string' },
    copyRight: { type: 'string' },
    bookFormat: { type: 'string' },
    lengthMin: { type: 'number' },
    image: { type: 'string' },
    explicit: { type: 'boolean' },
    isbn: { type: 'string' },
    language: { type: 'string' },
    publicationDate: { type: 'string' },
    rating: { type: 'number' },
    regions: { type: 'array', items: { type: 'string' } },
    releaseDate: { type: 'string' },
    series: {
        type: 'array',
        items: {
            type: 'object',
            properties: oaSeries
        }
    },
    authors: {
        type: 'array',
        items: {
            type: 'object',
            properties: oaAuthor
        }
    },
    narrators: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string', required: true }
            }
        }
    },
    genres: {
        type: 'array',
        items: {
            type: 'object',
            properties: oaGenre
        }
    }
};

export const oaRegion = {
    name: 'region',
    in: 'query',
    description: 'The region to search in',
    required: true,
    schema: {
        enum: ['US', 'UK', 'AU', 'DE', 'FR', 'CA', 'IT', 'JP', 'IN', 'BR', 'MX', 'ES']
    }
};