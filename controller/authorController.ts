import {app, HEADERS, oapi, prisma, regionMap} from "../app";
import {AuthorModel, GenreModel, mapAuthors} from "../models/type_model";
import {getAuthors, upsertAuthor} from "../util/authors";

app.get('/author/:asin',
    oapi.path({

    }),
    async (req, res) => {

        const asin: string = req.params.asin;
        const region: string = (req.query.region || 'US').toString().toLowerCase();

        let authors: AuthorModel[] = await getAuthors(asin, region);

        if (authors && authors.length > 0) {
            for (let author of authors) {
                if (author.region.toLowerCase() === region) {

                    if (author.description === undefined) {
                        author = await upsertAuthor(asin, region);
                    }

                    res.send(author);
                    return;
                }
            }
            res.send(authors[0]);
            return;
        }

        const author = await upsertAuthor(asin, region);
        if (author) {
            res.send(author);
        } else {
            res.status(404).send("Author not found");
        }
    });

