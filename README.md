# AudiMeta

> [!IMPORTANT]
> Do not use this instance anymore. I will stop providing the service and archive this project effective from the 20th of March 2026.\
> This started as a provider for Audiobookshelf because Audnexus returned many 500 errors and could not fetch series descriptions, but was never integrated. On top of this I learned a lot about the API, not needing suche service in general at all. This is just a basic wrapper around what Audible provides anyway.\

The license has been added, and the repo has been archived. Any existing modified fork of this repo before this license did so without any consent, thus no change of license nor retroactive change of license has been applied. The added license is and was the only consent for anyone to modify the code under this repo. Illegal torrenting hurts everyone and only benefits the torrenter. After seeing how this software was used, I decided to clearly disallow this use. Any other use is allowed under AGPLv3. Please see the license.

A fast and flexible Audible metadata provider with extensive querying options and bulk search capabilities.

## Overview

AudiMeta was created to serve as a comprehensive metadata provider for Audible content, offering rich querying options and advanced search functionality.

AudiMeta provides enhanced search capabilities, including bulk operations.


## Features

### Highlights

- Bulk search for ASINs (up to 50)
- Search across regions for cached books
- Find all books of an author or series

### Search Capabilities

- Search books by title
- Retrieve books by author
- Look up books by ASIN (single or bulk)
- Find books by series ASIN (all)
- Find books by author (supports fetching the first 50 books of an author and shows all cached books if searched or cached previously)
- Search by author name
- Search by narrator name
- Look up books by ISBN (Audible ISBN might not be the same as the audiobook ISBN of the book)

### Book Details

- Get detailed book information by ASIN, a list of ASINs, or ISBN

### Series Information

- Retrieve series information by name
- Retrieve series information by ASIN

### Author Information

- Get author details by name
- Get author details by ASIN

## Supported Regions

AudiMeta supports the following Audible regions:

| Region Code | Region Name    |
| ----------- | -------------- |
| `de`        | Germany        |
| `us`        | United States  |
| `uk`        | United Kingdom |
| `fr`        | France         |
| `it`        | Italy          |
| `es`        | Spain          |
| `jp`        | Japan          |
| `ca`        | Canada         |
| `au`        | Australia      |
| `in`        | India          |
| `br`        | Brazil         |

### Region Behavior

When searching for books, results will be returned regardless of regional availability by default if the books ASIN is cached.

### Ideas and Attribution

The source for some API endpoints came from [External Audible API](https://audible.readthedocs.io/en/latest/misc/external_api.html). Most have been used without this. But this was a great starting point!
Thanks to [Friends of Adonis](https://friendsofadonis.com/docs/openapi) for the awesome OpenAPI documentation tool.
Thanks to [Axiom](https://axiom.co) which provide a generous free tier for logging 5xx errors.
