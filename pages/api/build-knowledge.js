import { buildKnowledgeIndex } from "../../services/knowledgeIndexService";

export default async function handler(req, res) {
    try {
        const result = await buildKnowledgeIndex();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}