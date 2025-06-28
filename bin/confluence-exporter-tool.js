#!/usr/bin/env node

import chalk from 'chalk';
import convertFile from '../src/index.js';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import path from 'path';

const args = process.argv.slice(2);

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

// Utility functions
const logSuccess = (message) => console.log(format.success(`✅ ${message}`));
const logError = (message) => console.log(format.error(`❌ ${message}`));
const logInfo = (message) => console.log(format.info(`ℹ️ ${message}`));

async function loadPackageJson() {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = await readFile(packageJsonPath, 'utf-8');
    return JSON.parse(packageJson);
}

async function main() {
    if (args.includes('--help')) {
        console.log(`\n${format.usage('Usage:')} ${format.action('confluence-exporter-tool')} --input <input.xml> [--output <output.md>] [--silent]\n`);
        console.log(format.description('Description:'));
        console.log('  Convert Confluence Storage Format XML to GitHub Markdown for Foam.');
        console.log(`\n${format.usage('Options:')}`);
        console.log(`  ${format.option('--help')}          Show this help message and exit.`);
        console.log(`  ${format.option('--version')}       Show the tool's version and exit.`);
        console.log(`  ${format.option('--input')}         Path to Confluence XML file (required).`);
        console.log(`  ${format.option('--output')}        Output markdown file. Defaults to './output/output.md'.`);
        console.log(`  ${format.option('--silent')}        Suppress output messages. When this flag is used, the tool will run without logging any\n                      success or error messages.`);
        console.log(`\n${format.usage('Examples:')}`);
        console.log(`  ${format.example('confluence-exporter-tool --input input.xml --output output.md')}`);
        console.log(`  ${format.example('confluence-exporter-tool --input data.xml --silent')}`);
        process.exit(0);
    }

    if (args.includes('--version')) {
        const pkg = await loadPackageJson();
        console.log(`${format.action('confluence-exporter-tool')} version ${format.highlight(pkg.version)}`);
        process.exit(0);
    }

    const silent = args.includes('--silent');
    let inputArg = args.find(arg => arg === '--input' || arg === '-i');
    let outputArg = args.find(arg => arg === '--output' || arg === '-o');
    const inputIndex = args.indexOf(inputArg);
    const outputIndex = args.indexOf(outputArg);
    const inputPath = (inputIndex !== -1 && args[inputIndex + 1]) ? path.resolve(process.cwd(), args[inputIndex + 1]) : null;
    let outputPath;
    if (outputIndex !== -1 && args[outputIndex + 1]) {
        outputPath = path.resolve(process.cwd(), args[outputIndex + 1]);
    } else if (inputPath) {
        // Use original input filename, change extension to .md, and put in output/ directory
        const originalName = path.basename(inputPath, path.extname(inputPath)) + '.md';
        outputPath = path.resolve(process.cwd(), 'output', originalName);
    } else {
        outputPath = path.resolve(process.cwd(), 'output/output.md');
    }

    if (!inputPath) {
        console.error(format.error('Error: --input <input.xhtml> is required.'));
        process.exit(1);
    }

    try {
        await convertFile(inputPath, outputPath, { silent });
        if (!silent) {
            console.log(format.success(`✅ Markdown saved to ${outputPath}`));
        }
    } catch (err) {
        if (!silent) {
            console.error(format.error(`❌ Error: ${err.message}`));
        }
        process.exit(1);
    }
}

main();