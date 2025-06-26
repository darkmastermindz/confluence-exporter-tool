import { convertXMLToMarkdown } from '../lib/parser.js'; 
const fs = require('fs');
const path = require('path');

describe('convertXMLToMarkdown', () => {
  it('converts headings', () => {
    const xml = '<h1>Heading 1</h1><h2>Heading 2</h2>';
    expect(convertXMLToMarkdown(xml)).toContain('# Heading 1');
    expect(convertXMLToMarkdown(xml)).toContain('## Heading 2');
  });

  it('converts bold and italic', () => {
    const xml = '<strong>bold</strong><em>italic</em>';
    expect(convertXMLToMarkdown(xml)).toContain('**bold**');
    expect(convertXMLToMarkdown(xml)).toContain('*italic*');
  });

  it('converts code macro', () => {
    const xml = '<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[console.log(1);]]></ac:plain-text-body><ac:parameter ac:name="language">js</ac:parameter></ac:structured-macro>';
    expect(convertXMLToMarkdown(xml)).toContain('```js\nconsole.log(1);\n```');
  });

  it('converts attachments', () => {
    const xml = '<ri:attachment ri:filename="file.pdf" />';
    expect(convertXMLToMarkdown(xml)).toContain('[file.pdf](./file.pdf)');
  });

  it('converts links', () => {
    const xml = '<ac:link><ri:page ri:content-title="Page Title" /><ac:plain-text-link-body><![CDATA[Link to Page]]></ac:plain-text-link-body></ac:link>';
    expect(convertXMLToMarkdown(xml)).toContain('[[Page Title]]');
  });

  it('converts images', () => {
    const xml = '<ac:image><ri:attachment ri:filename="img.png" /></ac:image>';
    expect(convertXMLToMarkdown(xml)).toContain('![img.png](./img.png)');
  });

  it('converts task lists', () => {
    const xml = '<ac:task><ac:task-status>incomplete</ac:task-status><ac:task-body>Task</ac:task-body></ac:task>';
    expect(convertXMLToMarkdown(xml)).toContain('- [ ] Task');
  });

  it('converts tables', () => {
    const xml = '<table><tr><th>H</th></tr><tr><td>D</td></tr></table>';
    const md = convertXMLToMarkdown(xml);
    expect(md).toContain('| H |');
    expect(md).toContain('| --- |');
    expect(md).toContain('| D |');
  });

  it('converts blockquotes', () => {
    const xml = '<blockquote><p>quote</p></blockquote>';
    expect(convertXMLToMarkdown(xml)).toContain('> quote');
  });

  it('converts lists', () => {
    const xml = '<ul><li>item</li></ul><ol><li>item2</li></ol>';
    const md = convertXMLToMarkdown(xml);
    expect(md).toContain('- item');
    expect(md).toContain('1. item2');
  });

  it('converts paragraphs', () => {
    const xml = '<p>para</p>';
    expect(convertXMLToMarkdown(xml)).toContain('para');
  });

  it('converts template variables', () => {
    const xml = '<at:var at:name="foo" />';
    expect(convertXMLToMarkdown(xml)).toContain('{{foo}}');
  });

  it('converts emojis', () => {
    const xml = '<ac:emoticon ac:name="smile" />';
    expect(convertXMLToMarkdown(xml)).toContain(':smile:');
  });

  it('converts placeholders', () => {
    const xml = '<ac:placeholder>Fill this</ac:placeholder>';
    expect(convertXMLToMarkdown(xml)).toContain('_Instruction: Fill this_');
  });

  it('converts horizontal rules', () => {
    const xml = '<hr />';
    expect(convertXMLToMarkdown(xml)).toContain('---');
  });
});
