#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import chalk from 'chalk';
import convertFile from '../src/index.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

async function loadPackageJson() {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = await readFile(packageJsonPath, 'utf-8');
    return JSON.parse(packageJson);
}

const format = {
    usage: chalk.bold.cyan,
    description: chalk.bold.cyan,
    action: chalk.bold,
    argument: chalk.bold,
    option: chalk.yellow,
    example: chalk.dim,
    success: chalk.green.bold,
    error: chalk.red.bold,
    note: chalk.yellow,
    highlight: chalk.green.bold,
    file: chalk.cyan.bold,
};

program
  .name('confluence-to-foam')
  .description('Convert Confluence Storage Format XML to GitHub Markdown for Foam')
  .requiredOption('-i, --input <path>', 'Path to Confluence XML file')
  .option('-o, --output <path>', 'Output markdown file', './output/output.md')
  .option('--silent', 'Suppress output messages. When this flag is used, the tool will run without logging any success or error messages.')
  .addHelpText('after', `\n${format.example('Examples:')}\n  ${format.example('confluence-to-foam -i input.xml -o output.md')}\n  ${format.example('confluence-to-foam --input data.xml --silent')}\n`);

program.parse(args);

const options = program.opts();

if (!options.silent) {
  console.log(`\n${format.usage('Options:')}`);
  console.log(`  ${format.option('--help')}          Show this help message and exit.`);
  console.log(`  ${format.option('--version')}       Show the tool's version and exit.`);
  console.log(`  ${format.option('--silent')}        Suppress output messages. When this flag is used, the tool will run without logging any\n                      success or error messages.`);
}

const inputPath = path.resolve(__dirname, '..', options.input);
const outputPath = path.resolve(__dirname, '..', options.output);

(async () => {
  try {
    await convertFile(inputPath, outputPath, { silent: options.silent });
    if (!options.silent) {
      console.log(chalk.green(`✅ Markdown saved to ${options.output}`));
    }
  } catch (err) {
    if (!options.silent) {
      console.error(chalk.red(`❌ Error: ${err.message}`));
    }
    process.exit(1);
  }
})();
