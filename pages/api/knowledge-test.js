import { scanFolder } from "../../services/knowledgeService";

export default async function handler(req,res){

    const docs = await scanFolder("knowledge");
    const cleaner = require("../../utils/textCleaner");
console.log("Cleaner module:", cleaner);

    res.status(200).json({

        total: docs.length,

        documents: docs.map(doc=>({

            filename: doc.filename,

            words: doc.words,

            characters: doc.characters,

            preview: doc.preview

        }))

    });

}