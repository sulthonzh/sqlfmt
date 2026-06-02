/**
 * sqlfmt — Zero-dependency SQL formatter and pretty printer.
 *
 * Supports SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE,
 * JOINs, subqueries, CTEs, CASE/WHEN, UNION, window functions,
 * and common SQL expressions.
 */
type TokenType = 'keyword' | 'whitespace' | 'newline' | 'string' | 'number' | 'identifier' | 'operator' | 'punctuation' | 'comment' | 'other';
interface Token {
    type: TokenType;
    value: string;
}
declare function tokenize(sql: string): Token[];
export interface FormatOptions {
    indent?: string;
    uppercase?: boolean;
    linesBetweenQueries?: number;
    maxColumnLength?: number;
    commaPosition?: 'after' | 'before';
}
export declare function format(sql: string, options?: FormatOptions): string;
export declare function formatFile(input: string, options?: FormatOptions): string;
export { tokenize };
