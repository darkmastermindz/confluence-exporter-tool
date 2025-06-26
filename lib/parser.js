const cheerio = require('cheerio');

function convertXMLToMarkdown(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });

  // --- Macros ---
  $('ac\\:structured-macro').each((_, el) => {
    const macro = $(el).attr('ac:name');
    const code = $(el).find('ac\\:plain-text-body').text().trim();
    const paramLang = $(el).find('ac\\:parameter[ac\\:name="language"]').text() || '';

    if (macro === 'code') {
      $(el).replaceWith(`\
\
\
${paramLang}\n${code}\n\
\
\
`);
    } else if (macro === 'note' || macro === 'info' || macro === 'warning' || macro === 'tip') {
      $(el).replaceWith(`> **${macro.toUpperCase()}**: ${code}`);
    } else if (macro === 'expand') {
      $(el).replaceWith(`> **Expand:** ${code}`);
    } else {
      $(el).replaceWith(`> **[Unsupported macro: ${macro}]**`);
    }
  });

  // --- Images ---
  $('ac\\:image').each((_, el) => {
    const attachment = $(el).find('ri\\:attachment').attr('ri:filename');
    const external = $(el).find('ri\\:url').attr('ri:value');
    if (attachment) {
      $(el).replaceWith(`![${attachment}](./${attachment})`);
    } else if (external) {
      $(el).replaceWith(`![Image](${external})`);
    }
  });

  // --- Links ---
  $('ac\\:link').each((_, el) => {
    const page = $(el).find('ri\\:page');
    const url = $(el).find('ri\\:url').attr('ri:value');
    const attachment = $(el).find('ri\\:attachment').attr('ri:filename');
    const anchor = $(el).attr('ac:anchor');
    const body = $(el).find('ac\\:plain-text-link-body, ac\\:link-body').text().trim();

    if (page.length) {
      const title = page.attr('ri:content-title');
      $(el).replaceWith(`[[${title}]]`);
    } else if (url) {
      $(el).replaceWith(`[${body || url}](${url})`);
    } else if (attachment) {
      $(el).replaceWith(`[${body || attachment}](./${attachment})`);
    } else if (anchor) {
      $(el).replaceWith(`[${body || anchor}](#${anchor})`);
    }
  });

  // --- Task lists ---
  $('ac\\:task').each((_, el) => {
    const status = $(el).find('ac\\:task-status').text() === 'complete' ? 'x' : ' ';
    const body = $(el).find('ac\\:task-body').text().trim();
    $(el).replaceWith(`- [${status}] ${body}`);
  });

  // --- Emojis ---
  $('ac\\:emoticon').each((_, el) => {
    const name = $(el).attr('ac:name');
    $(el).replaceWith(`:${name}:`);
  });

  // --- Placeholders ---
  $('ac\\:placeholder').each((_, el) => {
    $(el).replaceWith(`_Instruction: ${$(el).text().trim()}_`);
  });

  // --- Text formatting ---
  $('strong, b').each((_, el) => $(el).replaceWith(`**${$(el).text()}**`));
  $('em, i').each((_, el) => $(el).replaceWith(`*${$(el).text()}*`));
  $('u').each((_, el) => $(el).replaceWith(`__${$(el).text()}__`));
  $('code, tt').each((_, el) => $(el).replaceWith('`' + $(el).text() + '`'));
  $('span[style*="line-through"]').each((_, el) => $(el).replaceWith(`~~${$(el).text()}~~`));
  $('br').each((_, el) => $(el).replaceWith(`  \n`));
  $('hr').each((_, el) => $(el).replaceWith(`\n---\n`));
  $('sup').each((_, el) => $(el).replaceWith(`^${$(el).text()}^`));
  $('sub').each((_, el) => $(el).replaceWith(`~${$(el).text()}~`));
  $('small, big').each((_, el) => $(el).replaceWith($(el).text()));
  $('blockquote').each((_, el) => $(el).replaceWith(`> ${$(el).text().trim()}`));

  // --- Headings ---
  for (let i = 1; i <= 6; i++) {
    $(`h${i}`).each((_, el) => {
      $(el).replaceWith(`${'#'.repeat(i)} ${$(el).text()}`);
    });
  }

  // --- Paragraphs ---
  $('p').each((_, el) => $(el).replaceWith(`${$(el).text()}\n`));

  // --- Lists ---
  $('ul, ol').each((_, list) => {
    let markdown = '';
    const isOrdered = list.tagName === 'ol';
    $(list).children('li').each((_, li) => {
      const bullet = isOrdered ? '1.' : '-';
      markdown += `${bullet} ${$(li).text()}\n`;
    });
    $(list).replaceWith(markdown);
  });

  // --- Tables ---
  $('table').each((_, table) => {
    let markdown = '';
    const rows = $(table).find('tr');
    rows.each((i, row) => {
      const cells = $(row).find('th, td');
      let line = '';
      cells.each((_, cell) => {
        line += '| ' + $(cell).text().trim() + ' ';
      });
      line += '|\n';
      markdown += line;
      if (i === 0) {
        markdown += '| ' + '--- |'.repeat(cells.length) + '\n';
      }
    });
    $(table).replaceWith(markdown);
  });

  // --- Layouts ---
  $('ac\\:layout, ac\\:layout-section, ac\\:layout-cell').each((_, el) => {
    $(el).replaceWith($(el).text());
  });

  // --- Template variables ---
  $('at\\:var').each((_, el) => {
    const name = $(el).attr('at:name');
    $(el).replaceWith(`{{${name}}}`);
  });

  return $.root().text().trim();
}

module.exports = convertXMLToMarkdown;
