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

  it('converts ordered lists with sequential numbers', () => {
    const xml = '<ol><li>first</li><li>second</li><li>third</li></ol>';
    const md = convertXMLToMarkdown(xml).split('\n').filter(line => line.trim().match(/^\d+\./));
    expect(md[0]).toContain('1. first');
    expect(md[1]).toContain('2. second');
    expect(md[2]).toContain('3. third');
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

  it('converts subscript and superscript', () => {
    expect(convertXMLToMarkdown('H<sub>2</sub>O')).toContain('H~2~O');
    expect(convertXMLToMarkdown('E = mc<sup>2</sup>')).toContain('E = mc^2^');
  });

  it('converts strikethrough', () => {
    expect(convertXMLToMarkdown('<span style="text-decoration: line-through;">strike</span>')).toContain('~~strike~~');
  });

  it('converts underline', () => {
    expect(convertXMLToMarkdown('<u>underline</u>')).toContain('<ins>underline</ins>'); // or custom handling
  });

  it('converts monospace and preformatted', () => {
    expect(convertXMLToMarkdown('<code>mono</code>')).toContain('`mono`');
    expect(convertXMLToMarkdown('<pre>preformatted</pre>')).toContain('```\npreformatted\n```');
  });

  it('converts color spans', () => {
    expect(convertXMLToMarkdown('<span style="color: red;">red</span>')).toContain('red');
  });

  it('converts small and big', () => {
    expect(convertXMLToMarkdown('<small>small</small>')).toContain('small');
    expect(convertXMLToMarkdown('<big>big</big>')).toContain('big');
  });

  it('converts line breaks', () => {
    expect(convertXMLToMarkdown('line1<br />line2')).toContain('line1  \nline2');
  });

  it('converts external links', () => {
    expect(convertXMLToMarkdown('<a href="http://example.com">Example</a>')).toContain('[Example](http://example.com)');
  });

  it('converts advanced images', () => {
    expect(convertXMLToMarkdown('<ac:image><ri:url ri:value="http://img.com/x.png" /></ac:image>')).toContain('![](http://img.com/x.png)');
  });

  it('converts layouts', () => {
    expect(convertXMLToMarkdown('<ac:layout><ac:layout-section><ac:layout-cell>Cell</ac:layout-cell></ac:layout-section></ac:layout>')).toContain('Cell');
  });

  it('converts HTML entities like &quot;', () => {
    expect(convertXMLToMarkdown('He said &quot;Hello&quot;')).toContain('He said "Hello"');
    expect(convertXMLToMarkdown('It\'s &apos;quoted&apos;')).toContain("It's 'quoted'");
    expect(convertXMLToMarkdown('Less than: &lt;tag&gt;')).toContain('Less than: <tag>');
    expect(convertXMLToMarkdown('Greater than: &gt;tag&lt;')).toContain('Greater than: >tag<');
    expect(convertXMLToMarkdown('Ampersand: Tom &amp; Jerry')).toContain('Ampersand: Tom & Jerry');
    expect(convertXMLToMarkdown('Non-breaking space: Hello&nbsp;World')).toContain('Non-breaking space: Hello World');
    expect(convertXMLToMarkdown('Mixed: &quot;Tom &amp; Jerry&quot; &lt;cartoon&gt;')).toContain('Mixed: "Tom & Jerry" <cartoon>');
  });
});
