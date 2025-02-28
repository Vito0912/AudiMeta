import {app, HEADERS, prisma, regionMap} from "../app";
import axios from "axios";
import {mapChapter} from "../models/type_model";

/**
 * Returns the chapters of a book
 */
app.get('/chapters/:asin', async (req, res) => {
    const asin: string = req.params.asin;
    const region: string = (req.query.region || 'US').toString().toLowerCase();

    if (!asin) {
        res.status(400).send("No asin provided");
        return;
    }


    const chapter = await prisma.chapter.findUnique({
        where: {bookAsin: asin}});

    if (chapter) {
        res.send(mapChapter(chapter));
        return;
    }

    try {
        const URL = `https://api.audible${regionMap[region]}/1.0/content/${asin}/metadata`;

        const response = await axios.get(URL, {
            headers: HEADERS,
            params: {'response_groups': 'chapter_info, content_reference, content_url'}
        });

        if(response.status === 404) {
            res.status(404).send("Chapters not found");
            return;
        }

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

            if (chapterInfo) {
                res.send(chapterInfo);
                return;
            }
        }

    } catch (e) {
        res.status(404).send("Chapters not found");
        return;
    }


    res.status(404).send("Chapters not found");
});