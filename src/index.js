import fs from 'fs-extra';
import { convertXMLToMarkdown } from '../lib/parser.js';



export async function convertFile(inputPath, outputPath, options = {}) {
    const { silent = false } = options;
    try {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`File not found: ${inputPath}`);
        }
        const xml = await fs.readFile(inputPath, 'utf-8');
        const markdown = convertXMLToMarkdown(xml);
        await fs.ensureDir(fs.dirname(outputPath));
        await fs.writeFile(outputPath, markdown, 'utf-8');
        if (!silent) {
            console.log(`Converted ${inputPath} to ${outputPath}`);
        }
        return markdown;
    } catch (err) {
        if (!silent) {
            console.error(`Error: ${err.message}`);
        }
        throw err;
    }
}

export default convertFile;