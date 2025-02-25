import {app, HEADERS, prisma, regionMap} from "../app";
import axios from "axios";

/**
 * Returns the chapters of a book
 */
app.get('/chapters/:asin', async (req, res) => {
    const asin: string = req.params.asin;
    const region: string = (req.query.region || 'US').toString().toLowerCase();

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

        // TODO: Check why not added
        chapterInfo.isAccurate = chapterMeta.is_accurate;
        chapterInfo.runtimeLengthMs = chapterMeta.runtime_length_ms;
        chapterInfo.runtimeLengthSec = chapterMeta.runtime_length_sec;

        await prisma.chapter.upsert({
            where: {
                bookAsin: asin
            },
            update: {
                content: chapterInfo.chapters,
            },
            create: {
                bookAsin: asin,
                content: chapterInfo.chapters
            }
        });

        res.send(chapterInfo);
    }
});