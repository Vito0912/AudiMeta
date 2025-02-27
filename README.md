# AudiMeta

A fast and flexible Audible metadata provider with extensive querying options and bulk search capabilities.

## Instance

The public instance of AudiMeta is available at [audimeta.de](https://audimeta.de).\
An uptime status page is available at [status.audimeta.de](https://status.audimeta.de).

Rate limits are in place to ensure fair usage of the service.
RPS (Requests per Second) limit is 5.\
RPM (Requests per Minute) limit is 150.\

## Overview

AudiMeta was created to serve as a comprehensive metadata provider for Audible content, offering rich querying options and advanced search functionality.

AudiMeta provides enhanced search capabilities including bulk operations.

> [!NOTE]
> In the future, AudiMeta may extend support to other audiobook vendors beyond Audible and creation of books.

This was inspired by [Audnexus](https://github.com/audnexus/audnexus). It shares some same APIs of Audible so data should be the same plus a bit more.

## Documentation

View the complete API documentation via the OpenAPI specification:
- [OpenAPI Documentation](https://audimeta.de)

## Features

### Highlights
- Bulk search for asins (up to 50)
- Search across regions for cached books
- Find all books of an author or series

### Search Capabilities
- Search books by title
- Retrieve books by author
- Look up books by ASIN (single or bulk)
- Find books by series asin (All)
- Find books by author (Supports fetching the first 50 books of an author. Shows all cached books of an author, if searched/cached prior)
- Search by author name
- Search by narrator name
- Look up books by ISBN (Audible ISBN might not be the same as the audiobook ISBN of the book)

### Book Details
- Get detailed book information by ASIN, list of ASINs, or ISBN

### Series Information
- Retrieve series information by name
- Retrieve series information by ASIN

### Author Information
- Get author details by name
- Get author details by ASIN

## Supported Regions

AudiMeta supports the following Audible regions:

| Region Code | Region Name     |
|-------------|-----------------|
| `de`        | Germany         |
| `us`        | United States   |
| `uk`        | United Kingdom  |
| `fr`        | France          |
| `it`        | Italy           |
| `es`        | Spain           |
| `jp`        | Japan           |
| `ca`        | Canada          |
| `au`        | Australia       |
| `in`        | India           |

### Region Behavior
When searching for books, results will be returned regardless of regional availability by default. Use the `strictRegion` query parameter to limit results to only books available in the specified region.

### Parameters
Please check the [OpenAPI Documentation](https://audimeta.de) for detailed information on the available query parameters.
Some endpoints only return cached data and do not query Audible again unless explicitly requested.

# Support

The service instance is free to use but costs me some money (Not a lot). So if you like the service and want to support it, you can do so by donating via GitHub Sponsors.