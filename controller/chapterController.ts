import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import axios from "axios";
import {mapChapter} from "../models/type_model";
import {oaAsinQuery, oaBook, oaChapter, oaRegion} from "../util/openApiModels";

/**
 * Returns the chapters of a book
 */
app.get('/chapters/:asin',
    oapi.path({
        tags: ['chapter'],
        summary: 'Get the chapters of a book',
        parameters: [
            oaRegion,
            oaAsinQuery
        ],
        responses: {
            200: {
                description: 'Chapters found',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: oaChapter
                        }
                    }
                }
            }
        }
    }),
    async (req, res) => {
    const asin: string = req.params.asin;
    const region: string = (req.query.region || 'US').toString().toLowerCase();


    const chapter = await prisma.chapter.findUnique({
        where: {bookAsin: asin}});

    if (chapter) {
        res.send(mapChapter(chapter));
        return;
    }

    const URL = `https://api.audible${regionMap[region]}/1.0/content/${asin}/metadata`;

    const response = await axios.get(URL, {
        headers: HEADERS,
        params: {'response_groups': 'chapter_info, content_reference, content_url'}
    });

    if (response.status === 200) {

        const chapterMeta = response.data.content_metadata;
        const chapterInfo = chapterMeta.chapter_info;

        chapterInfo.chapters = chapterInfo.chapters.map((chapter: any) => {
            return {
                lengthMs: chapter.length_ms,
                startOffsetMs: chapter.start_offset_ms,
                startOffsetSec: chapter.start_offset_sec,
                title: chapter.title
            }
        });

        await prisma.chapter.upsert({
            where: {
                bookAsin: asin
            },
            update: {
                content: chapterInfo,
            },
            create: {
                bookAsin: asin,
                content: chapterInfo
            }
        });

        res.send(chapterInfo);
    }
});