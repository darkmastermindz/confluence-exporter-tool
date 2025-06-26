# confluence-exporter-tool

Convert Confluence Storage Format XML to GitHub Flavored Markdown (GFM).

## Features
- Converts Confluence XML (Storage Format) to GitHub Markdown for use in Foam or other Markdown-based tools.
- Handles headings, lists, formatting, code blocks, macros, attachments, and more.

## Installation

Clone this repository and install dependencies:

```bash
git clone <repo-url>
cd confluence-exporter-tool
npm install
```

## Usage

```bash
node bin/index.js --input <path-to-confluence-xml> [--output <output-md-file>]
```

Or, if installed globally:

```bash
confluence-exporter-tool --input <path-to-confluence-xml> [--output <output-md-file>]
```

- `--input` (required): Path to the Confluence XML file.
- `--output` (optional): Path to save the output Markdown file. Defaults to `./output/output.md`.

### Example

```bash
node bin/index.js --input examples/sample_full_confluence.xml --output output.md
```

## Example Input
See `examples/sample_full_confluence.xml` for a sample Confluence XML file.

## License
MIT
