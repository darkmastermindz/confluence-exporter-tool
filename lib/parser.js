/**
 * Converts Confluence XML to Github Flavored Markdown format.
 * @param {*} xml 
 * @param {Object} [options] - Optional options object
 * @param {boolean} [options.autolint=true] - Remove consecutive duplicate headings if true
 * @returns 
 */
export function convertXMLToMarkdown(xml, options = {}) {
  const { autolint = true } = options;
  let output = xml;

  // --- Macros ---
  output = output.replace(/<ac:structured-macro ac:name="code">([\s\S]*?)<\/ac:structured-macro>/g, (match, inner) => {
    const langMatch = inner.match(/<ac:parameter ac:name="language">([\s\S]*?)<\/ac:parameter>/);
    const codeMatch = inner.match(/<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/);
    const lang = langMatch ? langMatch[1] : '';
    const code = codeMatch ? codeMatch[1].trim() : '';
    return `\
\`\`\`${lang}\n${code}\n\`\`\``;
  });
  output = output.replace(/<ac:structured-macro ac:name="(note|info|warning|tip)">([\s\S]*?)<\/ac:structured-macro>/g, (match, macro, inner) => {
    const codeMatch = inner.match(/<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/);
    const code = codeMatch ? codeMatch[1].trim() : '';
    return `> **${macro.toUpperCase()}**: ${code}`;
  });
  output = output.replace(/<ac:structured-macro ac:name="expand">([\s\S]*?)<\/ac:structured-macro>/g, (match, inner) => {
    const codeMatch = inner.match(/<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/);
    const code = codeMatch ? codeMatch[1].trim() : '';
    return `> **Expand:** ${code}`;
  });
  output = output.replace(/<ac:structured-macro ac:name="([^"]+)">([\s\S]*?)<\/ac:structured-macro>/g, (match, macro) => {
    return `> **[Unsupported macro: ${macro}]**`;
  });

  // --- Images (robust for whitespace and newlines) ---
  output = output.replace(/<ac:image>\s*<ri:attachment ri:filename="([^"]+)"\s*\/?>\s*<\/ac:image>/g, (match, filename) => `![${filename}](./${filename})`);

  // --- Links (robust for whitespace and newlines) ---
  output = output.replace(/<ac:link>\s*<ri:page ri:content-title="([^"]+)"\s*\/?>[\s\S]*?<\/ac:link>/g, (match, title) => `[[${title}]]`);

  // --- Task lists ---
  output = output.replace(/<ac:task>([\s\S]*?)<\/ac:task>/g, (match, inner) => {
    const status = /<ac:task-status>complete<\/ac:task-status>/.test(inner) ? 'x' : ' ';
    const bodyMatch = inner.match(/<ac:task-body>([\s\S]*?)<\/ac:task-body>/);
    const body = bodyMatch ? bodyMatch[1].trim() : '';
    return `- [${status}] ${body}`;
  });

  // --- Emojis ---
  output = output.replace(/<ac:emoticon ac:name="([^"]+)"\/>/g, (match, name) => `:${name}:`);

  // --- Placeholders ---
  output = output.replace(/<ac:placeholder>([\s\S]*?)<\/ac:placeholder>/g, (match, text) => `_Instruction: ${text.trim()}_`);

  // --- Text formatting ---
  output = output.replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, (m, t, text) => `**${text}**`);
  output = output.replace(/<(em|i)>([\s\S]*?)<\/\1>/g, (m, t, text) => `*${text}*`);
  output = output.replace(/<u\b[^>]*>([\s\S]*?)<\/u>/g, (m, text) => `<ins>${text}</ins>`);
  output = output.replace(/<(code|tt)>([\s\S]*?)<\/\1>/g, (m, t, text) => '`' + text + '`');
  output = output.replace(/<span style="[^"]*line-through[^"]*">([\s\S]*?)<\/span>/g, (m, text) => `~~${text}~~`);
  output = output.replace(/<br\s*\/?>(\n)?/g, '  \n');
  output = output.replace(/<hr\s*\/?>(\n)?/g, '\n---\n');
  output = output.replace(/<sup>([\s\S]*?)<\/sup>/g, (m, text) => `^${text}^`);
  output = output.replace(/<sub>([\s\S]*?)<\/sub>/g, (m, text) => `~${text}~`);
  output = output.replace(/<(small|big)>([\s\S]*?)<\/\1>/g, (m, t, text) => text);
  output = output.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m, text) => `> ${text.trim()}`);

  // --- Headings ---
  for (let i = 6; i >= 1; i--) {
    const re = new RegExp(`<h${i}>([\\s\\S]*?)<\\/h${i}>`, 'g');
    output = output.replace(re, (m, text) => `${'#'.repeat(i)} ${text}\n`);
  }

  // --- Paragraphs ---
  output = output.replace(/<p>([\s\S]*?)<\/p>/g, (m, text) => `${text}\n`);

  // --- Ordered and unordered lists with sequential numbers for ordered lists
  output = output.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/g, (m, t, inner) => {
    const isOrdered = t === 'ol';
    let idx = 1;
    return inner.replace(/<li>([\s\S]*?)<\/li>/g, (m, text) => {
      if (isOrdered) {
        return `${idx++}. ${text}\n`;
      } else {
        return `- ${text}\n`;
      }
    });
  });

  // --- Tables ---
  // Handles tables with <table>, <thead>, <tbody>, <tr>, <th>, <td>, <colgroup>, <col> tags, including those with thead/tbody/colgroup/col and extra attributes/classes
  output = output.replace(/<table[^>]*>[\s\S]*?<\/table>/g, (m) => {
    // Remove colgroup, thead, tbody wrappers for easier parsing
    let table = m.replace(/<colgroup[\s\S]*?<\/colgroup>/g, (colgroup) => {
      // Count columns from <col> tags if present
      const colCount = (colgroup.match(/<col\b[^>]*>/g) || []).length;
      return '';
    })
    .replace(/<thead[\s\S]*?>|<\/thead>/g, '')
    .replace(/<tbody[\s\S]*?>|<\/tbody>/g, '');
    // Extract rows
    const rowMatches = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    let markdown = '';
    let maxCols = 0;
    // First, determine max columns (for tables with colgroup/col or irregular rows)
    rowMatches.forEach(row => {
      const cellMatches = row.match(/<(th|td)[^>]*>[\s\S]*?<\/\1>/g) || [];
      if (cellMatches.length > maxCols) maxCols = cellMatches.length;
    });
    rowMatches.forEach((row, i) => {
      const cellMatches = row.match(/<(th|td)[^>]*>[\s\S]*?<\/\1>/g) || [];
      let line = '';
      cellMatches.forEach(cell => {
        const text = cell.replace(/<[^>]+>/g, '').trim();
        line += '| ' + text + ' ';
      });
      // Pad missing columns
      for (let j = cellMatches.length; j < maxCols; j++) {
        line += '|   ';
      }
      line += '|\n';
      markdown += line;
      if (i === 0 && maxCols > 0) {
        markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
      }
    });
    return markdown;
  });

  // --- ac:link with ac:anchor (jump to heading) ---
  // Converts <ac:link ac:anchor="foo">text</ac:link> to [text](#foo), and also supports <ac:link><ri:page ... /><ac:plain-text-link-body>...</ac:plain-text-link-body></ac:link>
  output = output.replace(/<ac:link[^>]*ac:anchor="([^"]+)"[^>]*>([\s\S]*?)<\/ac:link>/g, (m, anchor, inner) => {
    // Extract link text (strip tags, but prefer <ac:plain-text-link-body> if present)
    let text = '';
    const plainTextMatch = inner.match(/<ac:plain-text-link-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-link-body>/);
    if (plainTextMatch) {
      text = plainTextMatch[1].trim();
    } else {
      text = inner.replace(/<[^>]+>/g, '').trim();
    }
    if (!text) text = anchor.trim().toLowerCase().replace(/\s+/g, '-');
    // Anchor should be lowercased and spaces replaced with dashes for markdown
    const anchorId = anchor.trim().toLowerCase().replace(/\s+/g, '-');
    return `[${text}](#${anchorId})`;
  });

  // --- Layouts ---
  output = output.replace(/<ac:layout[\s\S]*?>|<\/ac:layout>|<ac:layout-section[\s\S]*?>|<\/ac:layout-section>|<ac:layout-cell[\s\S]*?>|<\/ac:layout-cell>/g, '');

  // --- Template variables ---
  output = output.replace(/<at:var at:name="([^"]+)"\/>/g, (m, name) => `{{${name}}}`);

  // --- Attachments ---
  output = output.replace(/<ri:attachment ri:filename="([^"]+)"\/>/g, (m, filename) => `[${filename}](./${filename})`);

  // --- Emojis (self-closing) ---
  output = output.replace(/<ac:emoticon ac:name="([^"]+)"\s*\/>/g, (match, name) => `:${name}:`);

  // --- Template variables (self-closing) ---
  output = output.replace(/<at:var at:name="([^"]+)"\s*\/>/g, (m, name) => `{{${name}}}`);

  // --- Attachments (self-closing) ---
  output = output.replace(/<ri:attachment ri:filename="([^"]+)"\s*\/>/g, (m, filename) => `[${filename}](./${filename})`);

  // --- Images (robust for whitespace and newlines) ---
  output = output.replace(/<ac:image>\s*<ri:attachment ri:filename="([^"]+)"\s*\/?>\s*<\/ac:image>/g, (match, filename) => `![${filename}](./${filename})`);

  // --- Links (robust for whitespace and newlines) ---
  output = output.replace(/<ac:link>\s*<ri:page ri:content-title="([^"]+)"\s*\/?>[\s\S]*?<\/ac:link>/g, (match, title) => `[[${title}]]`);

  // --- Advanced images (external URL) ---
  output = output.replace(/<ac:image>\s*<ri:url ri:value="([^"]+)"\s*\/?>\s*<\/ac:image>/g, (match, url) => `![](${url})`);

  // --- Underline: output as HTML ---
  output = output.replace(/<u>([\s\S]*?)<\/u>/g, (m, text) => `<ins>${text}</ins>`);

  // --- Preformatted: handle after tag stripping ---
  output = output.replace(/<pre>([\s\S]*?)<\/pre>/g, (m, text) => {
    const clean = text.replace(/^\s+|\s+$/g, ''); // trim all leading/trailing whitespace
    return `\`\`\`\n${clean}\n\`\`\``;
  });

  // --- External links: handle after tag stripping ---
  output = output.replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (m, href, text) => `[${text}](${href})`);

  // --- Remove any remaining tags except <ins> and </ins> ---
  output = output.replace(/<(?!\/?ins\b)[^>]+>/g, '');

  // --- Remove consecutive duplicate headings/titles ---
  if (autolint) {
    output = output.replace(/^(#+ .+)(\n\1)+/gm, '$1');
  }

  // --- HTML Entities ---
  output = output.replace(/&quot;/g, '"')
                 .replace(/&apos;/g, "'")
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&amp;/g, '&')
                 .replace(/&nbsp;/g, '\u00A0');

  return output.trim();
}

export default { convertXMLToMarkdown };