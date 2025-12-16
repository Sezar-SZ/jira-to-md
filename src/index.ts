import { marked } from 'marked';

export interface J2MMarkedOptions {
    breaks?: boolean;
    gfm?: boolean;

    mangle?: boolean;
    smartypants?: boolean;
    preserveExtraBlankLines?: boolean;
}

export default class J2M {
    private static configured = false;

    private static markedOptions: Required<J2MMarkedOptions> = {
        breaks: true,
        gfm: true,
        mangle: false,
        smartypants: true,
        preserveExtraBlankLines: false,
    };

    static configureMarked(options: J2MMarkedOptions = {}): void {
        J2M.markedOptions = {
            ...J2M.markedOptions,
            ...options,
        };

        const { preserveExtraBlankLines: _, ...markedOnlyOptions } = J2M.markedOptions;

        marked.setOptions(markedOnlyOptions);

        J2M.configured = true;
    }

    static mdToHtml(markdown: string): string {
        if (!J2M.configured) J2M.configureMarked();
        return marked.parse(markdown) as string;
    }

    static jiraToHtml(jira: string, options?: Pick<J2MMarkedOptions, 'preserveExtraBlankLines'>): string {
        if (!J2M.configured) J2M.configureMarked();

        const md = J2M.toMarkdown(jira);

        const preserve = options?.preserveExtraBlankLines ?? J2M.markedOptions.preserveExtraBlankLines;

        const processed = preserve ? J2M.preserveExtraBlankLines(md) : md;

        return marked.parse(processed) as string;
    }

    static toMarkdown(jira: string): string {
        return (
            jira
                // Un-Ordered Lists
                .replace(/^[ \t]*(\*+)\s+/gm, (_match, stars: string) => {
                    return `${'  '.repeat(Math.max(0, stars.length - 1))}* `;
                })
                // Ordered lists
                .replace(/^[ \t]*(#+)\s+/gm, (_match, nums: string) => {
                    return `${'   '.repeat(Math.max(0, nums.length - 1))}1. `;
                })
                // Headers 1-6
                .replace(/^h([0-6])\.(.*)$/gm, (_match, level: string, content: string) => {
                    return '#'.repeat(parseInt(level, 10)) + content;
                })
                // Bold (Jira: *text*)
                .replace(/\*(\S.*)\*/g, '**$1**')
                // Italic (Jira: _text_)
                .replace(/_(\S.*)_/g, '*$1*')
                // Monospaced text (Jira: {{text}})
                .replace(/\{\{([^}]+)\}\}/g, '`$1`')
                // Inserts
                .replace(/\+([^+]*)\+/g, '<ins>$1</ins>')
                // Superscript
                .replace(/\^([^^]*)\^/g, '<sup>$1</sup>')
                // Subscript
                .replace(/~([^~]*)~/g, '<sub>$1</sub>')
                // Strikethrough (Jira: -text-)
                .replace(/(\s+)-(\S+.*?\S)-(\s+)/g, '$1~~$2~~$3')
                // Code Block
                .replace(
                    /\{code(:([a-z]+))?([:|]?(title|borderStyle|borderColor|borderWidth|bgColor|titleBGColor)=.+?)*\}([\s\S]*?)\n?\{code\}/gm,
                    '```$2$5\n```'
                )
                // Pre-formatted text
                .replace(/{noformat}/g, '```')
                // Un-named Links
                .replace(/\[([^|]+?)\]/g, '<$1>')
                // Images
                .replace(/!(.+)!/g, '![]($1)')
                // Named Links
                .replace(/\[(.+?)\|(.+?)\]/g, '[$1]($2)')
                // Single Paragraph Blockquote
                .replace(/^bq\.\s+/gm, '> ')
                // Remove color: unsupported in md
                .replace(/\{color:[^}]+\}([\s\S]*?)\{color\}/gm, '$1')
                // panel into table
                .replace(/\{panel:title=([^}]*)\}\n?([\s\S]*?)\n?\{panel\}/gm, '\n| $1 |\n| --- |\n| $2 |')
                // table header
                .replace(/^[ \t]*((?:\|\|.*?)+\|\|)[ \t]*$/gm, (_match, headers: string) => {
                    const singleBarred = headers.replace(/\|\|/g, '|');
                    return `\n${singleBarred}\n${singleBarred.replace(/\|[^|]+/g, '| --- ')}`;
                })
                // remove leading-space of table headers and rows
                .replace(/^[ \t]*\|/gm, '|')
        );
    }

    static toJira(markdown: string): string {
        const map: Record<string, string> = {
            del: '-',
            ins: '+',
            sup: '^',
            sub: '~',
        };

        return (
            markdown
                // Tables
                .replace(
                    /^\n((?:\|.*?)+\|)[ \t]*\n((?:\|\s*?-{3,}\s*?)+\|)[ \t]*\n((?:(?:\|.*?)+\|[ \t]*\n)*)$/gm,
                    (match, headerLine: string, separatorLine: string, rowstr: string) => {
                        const headers = headerLine.match(/[^|]+(?=\|)/g);
                        const separators = separatorLine.match(/[^|]+(?=\|)/g);
                        if (!headers || !separators) return match;
                        if (headers.length !== separators.length) return match;

                        const rows = rowstr.split('\n');
                        if (rows.length === 2 && headers.length === 1) {
                            // Panel
                            return `{panel:title=${headers[0].trim()}}\n${rowstr
                                .replace(/^\|(.*)[ \t]*\|/, '$1')
                                .trim()}\n{panel}\n`;
                        }

                        return `||${headers.join('||')}||\n${rowstr}`;
                    }
                )
                // Bold, Italic, and Combined
                .replace(/([*_]+)(\S.*?)\1/g, (_match, wrapper: string, content: string) => {
                    switch (wrapper.length) {
                        case 1:
                            return `_${content}_`;
                        case 2:
                            return `*${content}*`;
                        case 3:
                            return `_*${content}*_`;
                        default:
                            return wrapper + content + wrapper;
                    }
                })
                // Headers (# format)
                .replace(/^([#]+)(.*?)$/gm, (_match, level: string, content: string) => {
                    return `h${level.length}.${content}`;
                })
                // Headers (H1 and H2 underlines)
                .replace(/^(.*?)\n([=-]+)$/gm, (_match, content: string, level: string) => {
                    return `h${level[0] === '=' ? 1 : 2}. ${content}`;
                })
                // Ordered lists
                .replace(/^([ \t]*)\d+\.\s+/gm, (_match, spaces: string) => {
                    return `${'#'.repeat(Math.floor(spaces.length / 3) + 1)} `;
                })
                // Un-Ordered Lists
                .replace(/^([ \t]*)\*\s+/gm, (_match, spaces: string) => {
                    return `${'*'.repeat(Math.floor(spaces.length / 2) + 1)} `;
                })
                // Inline HTML tags for del/ins/sup/sub -> Jira markers
                .replace(
                    new RegExp(`<(${Object.keys(map).join('|')})>(.*?)</\\1>`, 'g'),
                    (_m, from: string, content: string) => {
                        const to = map[from];
                        return to + content + to;
                    }
                )
                // Other strikethrough
                .replace(/(\s+)~~(.*?)~~(\s+)/g, '$1-$2-$3')
                // Code Block
                .replace(/```(.+\n)?([\s\S]*?)```/g, (_match, synt: string | undefined, content: string) => {
                    let code = '{code}';
                    if (synt) code = `{code:${synt.replace(/\n/g, '')}}\n`;
                    return `${code}${content}{code}`;
                })
                // Inline code
                .replace(/`([^`]+)`/g, '{{$1}}')
                // Images
                .replace(/!\[[^\]]*\]\(([^)]+)\)/g, '!$1!')
                // Named Link
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]')
                // Un-Named Link
                .replace(/<([^>]+)>/g, '[$1]')
                // Blockquote
                .replace(/^>/gm, 'bq.')
        );
    }

    private static preserveExtraBlankLines(md: string): string {
        const parts = md.split(/(```[\s\S]*?```)/g);

        return parts
            .map((part) => {
                if (part.startsWith('```')) return part;

                return part.replace(/\n{3,}/g, (m) => {
                    const extra = m.length - 2;
                    return '\n\n' + '<br>\n'.repeat(extra);
                });
            })
            .join('');
    }
}
