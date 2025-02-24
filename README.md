# AudiMeta

A fast and flexible Audible metadata provider with extensive querying options and bulk search capabilities.

## Overview

AudiMeta was created to serve as a comprehensive metadata provider for Audible content, offering rich querying options and advanced search functionality.
This was inspired by [Audnexus](https://github.com/audnexus/audnexus). AudiMeta provides enhanced search capabilities including bulk operations.

In the future, AudiMeta may extend support to other audiobook vendors beyond Audible.

## Documentation

View the complete API documentation via the OpenAPI specification:
- [OpenAPI Documentation](https://audimeta.de/swaggerui)

## Features

### Search Capabilities
- Search books by title
- Retrieve books by author
- Look up books by ASIN (single or bulk)
- Find books by series name
- Search by author name
- Search by narrator name
- Look up books by ISBN

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
- `de` (Germany)
- `us` (United States)
- `uk` (United Kingdom)
- `fr` (France)
- `it` (Italy)
- `es` (Spain)
- `jp` (Japan)
- `ca` (Canada)
- `au` (Australia)
- `in` (India)

### Region Behavior
When searching for books, results will be returned regardless of regional availability by default. Use the `strictRegion` query parameter to limit results to only books available in the specified region.
