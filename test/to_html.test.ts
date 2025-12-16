import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import J2M from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('mdToHtml', () => {
    it('should exist', () => {
        expect(J2M.mdToHtml('')).to.exist;
    });

    it('should be a function', () => {
        expect(J2M.mdToHtml).to.be.a('function');
    });

    it('should provide html from md', () => {
        const mdStr = fs.readFileSync(path.resolve(__dirname, 'test.md'), 'utf8');
        const htmlStr = fs.readFileSync(path.resolve(__dirname, 'test.html'), 'utf8');

        const html = J2M.mdToHtml(mdStr);
        expect(html).to.equal(htmlStr);
    });
});

describe('jiraToHtml', () => {
    it('should exist', () => {
        expect(J2M.jiraToHtml('')).to.exist;
    });

    it('should be a function', () => {
        expect(J2M.jiraToHtml).to.be.a('function');
    });

    it('should provide html from jira', () => {
        const jiraStr = fs.readFileSync(path.resolve(__dirname, 'test.jira'), 'utf8');
        const htmlStr = fs.readFileSync(path.resolve(__dirname, 'test.html'), 'utf8');

        const html = J2M.jiraToHtml(jiraStr);
        expect(html).to.equal(htmlStr);
    });
});
