import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import J2M from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('toMarkdown', () => {
    it('should exist', () => {
        expect(J2M.toMarkdown).to.exist;
    });

    it('should be a function', () => {
        expect(J2M.toMarkdown).to.be.a('function');
    });

    it('should convert bolds properly', () => {
        const markdown = J2M.toMarkdown('*bold*');
        expect(markdown).to.equal('**bold**');
    });

    it('should convert italics properly', () => {
        const markdown = J2M.toMarkdown('_italic_');
        expect(markdown).to.equal('*italic*');
    });

    it('should convert monospaced content properly', () => {
        const markdown = J2M.toMarkdown('{{monospaced}}');
        expect(markdown).to.equal('`monospaced`');
    });

    // it("should convert citations properly", () => {
    //   const markdown = J2M.toMarkdown("??citation??");
    //   expect(markdown).to.equal("<cite>citation</cite>");
    // });

    it('should convert strikethroughs properly', () => {
        const markdown = J2M.toMarkdown(' -deleted- ');
        expect(markdown).to.equal(' ~~deleted~~ ');
    });

    it('should convert inserts properly', () => {
        const markdown = J2M.toMarkdown('+inserted+');
        expect(markdown).to.equal('<ins>inserted</ins>');
    });

    it('should convert superscript properly', () => {
        const markdown = J2M.toMarkdown('^superscript^');
        expect(markdown).to.equal('<sup>superscript</sup>');
    });

    it('should convert subscript properly', () => {
        const markdown = J2M.toMarkdown('~subscript~');
        expect(markdown).to.equal('<sub>subscript</sub>');
    });

    it('should convert preformatted blocks properly', () => {
        const markdown = J2M.toMarkdown('{noformat}\nso *no* further _formatting_ is done here\n{noformat}');
        expect(markdown).to.equal('```\nso **no** further *formatting* is done here\n```');
    });

    it('should convert language-specific code blocks properly', () => {
        const markdown = J2M.toMarkdown("{code:javascript}\nconst hello = 'world';\n{code}");
        expect(markdown).to.equal("```javascript\nconst hello = 'world';\n```");
    });

    it('should convert code without language-specific and with title into code block', () => {
        const markdown = J2M.toMarkdown(
            '{code:title=Foo.java}\nclass Foo {\n  public static void main() {\n  }\n}\n{code}'
        );
        expect(markdown).to.equal('```\nclass Foo {\n  public static void main() {\n  }\n}\n```');
    });

    it('should convert code without line feed before the end code block', () => {
        const markdown = J2M.toMarkdown('{code:java}\njava code{code}');
        expect(markdown).to.equal('```java\njava code\n```');
    });

    it('should convert fully configured code block', () => {
        const markdown = J2M.toMarkdown(
            '{code:xml|title=My Title|borderStyle=dashed|borderColor=#ccc|titleBGColor=#F7D6C1|bgColor=#FFFFCE}' +
                '\n    <test>' +
                '\n        <another tag="attribute"/>' +
                '\n    </test>' +
                '\n{code}'
        );
        expect(markdown).to.equal('```xml\n    <test>\n        <another tag="attribute"/>\n    </test>\n```');
    });

    it('should convert images properly', () => {
        const markdown = J2M.toMarkdown('!http://google.com/image!');
        expect(markdown).to.equal('![](http://google.com/image)');
    });

    it('should convert linked images properly', () => {
        const markdown = J2M.toMarkdown('[!http://google.com/image!|http://google.com/link]');
        expect(markdown).to.equal('[![](http://google.com/image)](http://google.com/link)');
    });

    it('should convert unnamed links properly', () => {
        const markdown = J2M.toMarkdown('[http://google.com]');
        expect(markdown).to.equal('<http://google.com>');
    });

    it('should convert named links properly', () => {
        const markdown = J2M.toMarkdown('[Google|http://google.com]');
        expect(markdown).to.equal('[Google](http://google.com)');
    });

    it('should convert headers properly', () => {
        const h1 = J2M.toMarkdown('h1. Biggest heading');
        const h2 = J2M.toMarkdown('h2. Bigger heading');
        const h3 = J2M.toMarkdown('h3. Big heading');
        const h4 = J2M.toMarkdown('h4. Normal heading');
        const h5 = J2M.toMarkdown('h5. Small heading');
        const h6 = J2M.toMarkdown('h6. Smallest heading');

        expect(h1).to.equal('# Biggest heading');
        expect(h2).to.equal('## Bigger heading');
        expect(h3).to.equal('### Big heading');
        expect(h4).to.equal('#### Normal heading');
        expect(h5).to.equal('##### Small heading');
        expect(h6).to.equal('###### Smallest heading');
    });

    it('should convert blockquotes properly', () => {
        const markdown = J2M.toMarkdown('bq. This is a long blockquote type thingy that needs to be converted.');
        expect(markdown).to.equal('> This is a long blockquote type thingy that needs to be converted.');
    });

    it('should convert un-ordered lists properly', () => {
        const markdown = J2M.toMarkdown('* Foo\n* Bar\n* Baz\n** FooBar\n** BarBaz\n*** FooBarBaz\n* Starting Over');
        expect(markdown).to.equal('* Foo\n* Bar\n* Baz\n  * FooBar\n  * BarBaz\n    * FooBarBaz\n* Starting Over');
    });

    it('should convert ordered lists properly', () => {
        const markdown = J2M.toMarkdown('# Foo\n# Bar\n# Baz\n## FooBar\n## BarBaz\n### FooBarBaz\n# Starting Over');
        expect(markdown).to.equal(
            '1. Foo\n1. Bar\n1. Baz\n   1. FooBar\n   1. BarBaz\n      1. FooBarBaz\n1. Starting Over'
        );
    });

    it('should handle bold AND italic (combined) correctly', () => {
        const markdown = J2M.toMarkdown('This is _*emphatically bold*_!');
        expect(markdown).to.equal('This is ***emphatically bold***!');
    });

    it('should handle bold within a un-ordered list item', () => {
        const markdown = J2M.toMarkdown('* This is not bold!\n** This is *bold*.');
        expect(markdown).to.equal('* This is not bold!\n  * This is **bold**.');
    });

    it('should be able to handle a complicated multi-line jira-wiki string and convert it to markdown', () => {
        const jiraStr = fs.readFileSync(path.resolve(__dirname, 'test.jira'), 'utf8');
        const mdStr = fs.readFileSync(path.resolve(__dirname, 'test.md'), 'utf8');

        const markdown = J2M.toMarkdown(jiraStr);
        expect(markdown).to.equal(mdStr);
    });

    it('should not recognize strikethroughs over multiple lines', () => {
        const markdown = J2M.toMarkdown(
            "* Here's an un-ordered list line\n* Multi-line strikethroughs shouldn't work."
        );
        expect(markdown).to.equal("* Here's an un-ordered list line\n* Multi-line strikethroughs shouldn't work.");
    });

    it('should remove color attributes', () => {
        const markdown = J2M.toMarkdown('A text with{color:blue} blue \n lines {color} is not necessary.');
        expect(markdown).to.equal('A text with blue \n lines  is not necessary.');
    });

    it('should remove multiple color attributes', () => {
        const markdown = J2M.toMarkdown(
            'A text with{color:blue} blue \n lines {color} is not necessary. {color:red} red {color}'
        );
        expect(markdown).to.equal('A text with blue \n lines  is not necessary.  red ');
    });
});
