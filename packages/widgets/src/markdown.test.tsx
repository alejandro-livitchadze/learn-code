import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

const html = (text: string): string => renderToStaticMarkup(<Markdown text={text} />);

describe('Markdown subset', () => {
  it('renders paragraphs and lists', () => {
    expect(html('one\ntwo\n\n- a\n- b')).toBe(
      '<div class="w-prose"><p>one two</p><ul><li>a</li><li>b</li></ul></div>',
    );
  });
  it('renders inline code, bold and italic', () => {
    expect(html('`x` **b** *i*')).toContain('<code>x</code> <strong>b</strong> <em>i</em>');
  });
  it('renders http and https links with rel="noreferrer"', () => {
    expect(html('[docs](https://example.com/a)')).toContain(
      '<a href="https://example.com/a" rel="noreferrer">docs</a>',
    );
    expect(html('[docs](http://example.com/)')).toContain('href="http://example.com/"');
  });
  it('never makes an anchor from a javascript: link', () => {
    const out = html('[click](javascript:alert(1)) and [x](JaVaScRiPt:alert)');
    expect(out).not.toContain('<a');
    expect(out).not.toContain('href');
    expect(out).toContain('click');
  });
  it('renders fenced code as a pre block, keeping blank lines and markup characters', () => {
    const out = html('before\n\n```sql\nselect *\n\nfrom a -- **x**\n```\n\nafter');
    expect(out).toContain('<pre><code>select *\n\nfrom a -- **x**</code></pre>');
    expect(out).toContain('<p>before</p>');
    expect(out).toContain('<p>after</p>');
    expect(out).not.toContain('<strong>');
  });
  it('escapes HTML', () => {
    expect(html('<script>x</script>')).not.toContain('<script>');
  });
});
