import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import J2M from '../src/index.js';
import { describe, it } from 'node:test';

// If you export default J2M:
//   export default class J2M { ... }
// then this import is correct:

// If instead your package exports named exports, adjust accordingly.
// e.g. import { J2M } from "../src/j2m";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('toJira', () => {
    it('should exist', () => {
        expect(J2M.toJira).to.exist;
    });

    it('should be a function', () => {
        expect(J2M.toJira).to.be.a('function');
    });

    it('should convert bolds properly', () => {
        const jira = J2M.toJira('**bold**');
        expect(jira).to.equal('*bold*');
    });

    it('should convert italics properly', () => {
        const jira = J2M.toJira('*italic*');
        expect(jira).to.equal('_italic_');
    });

    it('should convert monospaced content properly', () => {
        const jira = J2M.toJira('`monospaced`');
        expect(jira).to.equal('{{monospaced}}');
    });

    // it("should convert citations properly", () => {
    //   const jira = J2M.toJira("<cite>citation</cite>");
    //   expect(jira).to.equal("??citation??");
    // });

    it('should convert strikethroughs properly', () => {
        const jira = J2M.toJira(' ~~deleted~~ ');
        expect(jira).to.equal(' -deleted- ');
    });

    it('should convert inserts properly', () => {
        const jira = J2M.toJira('<ins>inserted</ins>');
        expect(jira).to.equal('+inserted+');
    });

    it('should convert superscript properly', () => {
        const jira = J2M.toJira('<sup>superscript</sup>');
        expect(jira).to.equal('^superscript^');
    });

    it('should convert subscript properly', () => {
        const jira = J2M.toJira('<sub>subscript</sub>');
        expect(jira).to.equal('~subscript~');
    });

    it('should convert preformatted blocks properly', () => {
        const jira = J2M.toJira('```\nso *no* further **formatting** is done here\n```');
        expect(jira).to.equal('{code}\nso _no_ further *formatting* is done here\n{code}');
    });

    it('should convert language-specific code blocks properly', () => {
        const jira = J2M.toJira("```javascript\nconst hello = 'world';\n```");
        expect(jira).to.equal("{code:javascript}\nconst hello = 'world';\n{code}");
    });

    it('should convert unnamed images properly', () => {
        const jira = J2M.toJira('![](http://google.com/image)');
        expect(jira).to.equal('!http://google.com/image!');
    });

    it('should convert named images properly', () => {
        const jira = J2M.toJira('![Google](http://google.com/image)');
        expect(jira).to.equal('!http://google.com/image!');
    });

    it('should convert linked images properly', () => {
        const jira = J2M.toJira('[![Google](http://google.com/image)](http://google.com/link)');
        expect(jira).to.equal('[!http://google.com/image!|http://google.com/link]');
    });

    it('should convert unnamed links properly', () => {
        const jira = J2M.toJira('<http://google.com>');
        expect(jira).to.equal('[http://google.com]');
    });

    it('should convert named links properly', () => {
        const jira = J2M.toJira('[Google](http://google.com)');
        expect(jira).to.equal('[Google|http://google.com]');
    });

    it('should convert headers properly', () => {
        const h1 = J2M.toJira('# Biggest heading');
        const h2 = J2M.toJira('## Bigger heading');
        const h3 = J2M.toJira('### Big heading');
        const h4 = J2M.toJira('#### Normal heading');
        const h5 = J2M.toJira('##### Small heading');
        const h6 = J2M.toJira('###### Smallest heading');

        expect(h1).to.equal('h1. Biggest heading');
        expect(h2).to.equal('h2. Bigger heading');
        expect(h3).to.equal('h3. Big heading');
        expect(h4).to.equal('h4. Normal heading');
        expect(h5).to.equal('h5. Small heading');
        expect(h6).to.equal('h6. Smallest heading');
    });

    it('should convert underline-style headers properly', () => {
        const h1 = J2M.toJira('Biggest heading\n=======');
        const h2 = J2M.toJira('Bigger heading\n------');

        expect(h1).to.equal('h1. Biggest heading');
        expect(h2).to.equal('h2. Bigger heading');
    });

    it('should convert blockquotes properly', () => {
        const jira = J2M.toJira('> This is a long blockquote type thingy that needs to be converted.');
        expect(jira).to.equal('bq. This is a long blockquote type thingy that needs to be converted.');
    });

    it('should convert un-ordered lists properly', () => {
        const jira = J2M.toJira('* Foo\n* Bar\n* Baz\n  * FooBar\n  * BarBaz\n    * FooBarBaz\n* Starting Over');
        expect(jira).to.equal('* Foo\n* Bar\n* Baz\n** FooBar\n** BarBaz\n*** FooBarBaz\n* Starting Over');
    });

    it('should convert ordered lists properly', () => {
        const jira = J2M.toJira(
            '1. Foo\n1. Bar\n1. Baz\n   1. FooBar\n   1. BarBaz\n      1. FooBarBaz\n1. Starting Over'
        );
        expect(jira).to.equal('# Foo\n# Bar\n# Baz\n## FooBar\n## BarBaz\n### FooBarBaz\n# Starting Over');
    });

    it('should handle bold AND italic (combined) correctly', () => {
        const jira = J2M.toJira('This is ***emphatically bold***!');
        expect(jira).to.equal('This is _*emphatically bold*_!');
    });

    it('should handle bold within a un-ordered list item', () => {
        const jira = J2M.toJira('* This is not bold!\n  * This is **bold**.');
        expect(jira).to.equal('* This is not bold!\n** This is *bold*.');
    });

    it('should be able to handle a complicated multi-line markdown string and convert it to jira', () => {
        const jiraStr = fs.readFileSync(path.resolve(__dirname, 'test.jira'), 'utf8');
        const mdStr = fs.readFileSync(path.resolve(__dirname, 'test.md'), 'utf8');

        const jira = J2M.toJira(mdStr);
        expect(jira).to.equal(jiraStr);
    });
});
