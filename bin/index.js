#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import chalk from 'chalk';
import convert from '../lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('confluence-to-foam')
  .description('Convert Confluence Storage Format XML to GitHub Markdown for Foam')
  .requiredOption('-i, --input <path>', 'Path to Confluence XML file')
  .option('-o, --output <path>', 'Output markdown file', './output/output.md');

program.parse();

const options = program.opts();
const inputPath = path.resolve(__dirname, '..', options.input);
const outputPath = path.resolve(__dirname, '..', options.output);

try {
  const xml = fs.readFileSync(inputPath, 'utf-8');
  const markdown = convert(xml);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf-8');
  console.log(chalk.green(`✅ Markdown saved to ${options.output}`));
} catch (err) {
  console.error(chalk.red(`❌ Error: ${err.message}`));
  process.exit(1);
}
