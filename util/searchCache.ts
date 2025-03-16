import { logger, prisma } from '../app';
import hash = require('object-hash');

export async function getSearchCacheResult(search: string, req, limit?: number, page?: number): Promise<string[]> {
  if (req.query.cache && req.query.cache === 'false') {
    logger.info('Cache disabled');
    return [];
  }

  const resultDB = await prisma.bookSearch.findUnique({
    where: {
      query: search,
    },
    select: {
      result: true,
    },
  });

  if (resultDB == null) {
    return [];
  }

  let result: string[];

  if (limit != null && page != null) {
    result = resultDB.result.slice(page * limit, (page + 1) * limit);
  } else {
    result = resultDB.result;
  }

  return result;
}

export async function insertSearchCacheResult(search: string, result: string[]): Promise<void> {
  await prisma.bookSearch.upsert({
    where: {
      query: search,
    },
    update: {
      count: {
        increment: 1,
      },
      result: result,
    },
    create: {
      query: search,
      result: result,
    },
  });
}

export function generateSearchKey(...args: string[]): string {
  const type = args.shift();
  return `${type}.${hash(args)}`;
}
