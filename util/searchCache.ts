import {prisma} from "../app";
import hash = require('object-hash');

export async function getSearchCacheResult(search: string): Promise<string[] | undefined> {
    const result = await prisma.bookSearch.findUnique({
        where: {
            query: search
        },
        select: {
            result: true
        }
    });

    return result?.result;
}

export async function insertSearchCacheResult(search: string, result: string[]): Promise<void> {
    await prisma.bookSearch.upsert({
        where: {
            query: search
        },
        update: {
            count: {
                increment: 1
            }
        },
        create: {
            query: search,
            result: result
        }
    });
}

export function generateSearchKey(...args: string[]): string {
    return hash(args);
}