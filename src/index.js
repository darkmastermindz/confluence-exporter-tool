import fs from 'fs-extra';
import path from 'path';
import { convertXMLToMarkdown as convertXHTMLtoMarkdown } from '../lib/parser.js';



export async function convertFile(inputPath, outputPath, options = {}) {
    const { silent = false, autolint = true } = options;
    try {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`File not found: ${inputPath}`);
        }
        const xhtml = await fs.readFile(inputPath, 'utf-8');
        let markdown = convertXHTMLtoMarkdown(xhtml, { autolint });
        // Remove consecutive duplicate headings if autolint is true (default)
        if (autolint) {
            markdown = markdown.replace(/^(#+ .+)(\n\1)+/gm, '$1');
        }
        await fs.ensureDir(path.dirname(outputPath));
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