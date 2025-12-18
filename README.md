# jira-to-md

## JIRA to MarkDown text format converter

Convert from JIRA text formatting to GitHub Flavored MarkDown and back again. Also allows for both to be converted to HTML.

## Credits

This package is a fork of the J2M library by Kyle Farris, converted to TypeScript with additional features.

## Installation

```bash
npm install jira-to-md
```

## Supported Conversions

NOTE: All conversion work bi-directionally (from jira to markdown and back again).

* Headers (H1-H6)
* Bold
* Italic
* Bold + Italic
* Un-ordered lists
* Ordered lists (with help from [aarbanas](https://github.com/aarbanas))
* Programming Language-specific code blocks (with help from herbert-venancio)
* Inline preformatted text spans
* Un-named links
* Named links
* Monospaced Text
* Strikethroughs
* Inserts
* Superscripts
* Subscripts
* Single-paragraph blockquotes
* Tables (thanks to erykwarren)
* Panels (thanks to erykwarren)

## How to Use

### Markdown String

We'll refer to this as the `md` variable in the examples below.

```md
**Some bold things**
*Some italic stuff*
## H2
<http://google.com>
```

### Atlassian Wiki Syntax

We'll refer to this as the `jira` variable in the examples below.

```md
*Some bold things**
_Some italic stuff_
h2. H2
[http://google.com]
```

### Examples

```ts
// Include the module
import J2M from "jira-to-md";

// If converting from Markdown to Jira Wiki Syntax:
const jira = J2M.toJira(md);

// If converting from Jira Wiki Syntax to Markdown:
const md = J2M.toMarkdown(jira);

// If converting from Markdown to HTML:
const html = J2M.mdToHtml(md);

// If converting from JIRA Wiki Syntax to HTML:
const html = J2M.jiraToHtml(jira);
```

By default, Markdown collapses multiple empty lines.

You can preserve extra vertical spacing visually when converting Jira to HTML

```ts
J2M.configureMarked({
  preserveExtraBlankLines: true
});
```

Or do it inline:

```ts
J2M.jiraToHtml(jira, { preserveExtraBlankLines: true })
```

