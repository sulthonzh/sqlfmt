"use strict";
/**
 * sqlfmt — Zero-dependency SQL formatter and pretty printer.
 *
 * Supports SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE,
 * JOINs, subqueries, CTEs, CASE/WHEN, UNION, window functions,
 * and common SQL expressions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = format;
exports.formatFile = formatFile;
exports.tokenize = tokenize;
const KEYWORDS = new Set([
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
    'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT',
    'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'AS', 'GROUP', 'BY',
    'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
    'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS',
    'BETWEEN', 'LIKE', 'CAST', 'COALESCE', 'NULLIF', 'IF',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT',
    'DEFAULT', 'CHECK', 'UNIQUE', 'AUTO_INCREMENT', 'SERIAL',
    'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'GRANT', 'REVOKE',
    'TRUNCATE', 'EXPLAIN', 'ANALYZE', 'WITH', 'RECURSIVE',
    'OVER', 'PARTITION', 'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING',
    'FOLLOWING', 'CURRENT', 'ROW', 'WINDOW', 'LATERAL',
    'RETURNING', 'CONFLICT', 'NOTHING', 'UPSERT', 'REPLACE',
    'MERGE', 'MATCHED', 'USING', 'FETCH', 'NEXT', 'ONLY',
    'ILIKE', 'SIMILAR', 'TO', 'ANY', 'SOME', 'BOOLEAN',
    'INTEGER', 'BIGINT', 'SMALLINT', 'NUMERIC', 'DECIMAL',
    'REAL', 'DOUBLE', 'FLOAT', 'PRECISION', 'VARCHAR', 'CHAR',
    'TEXT', 'BLOB', 'DATE', 'TIME', 'TIMESTAMP', 'INTERVAL',
    'ZONE', 'WITHOUT', 'TRUE', 'FALSE', 'UNKNOWN', 'NATURAL',
    'MATERIALIZED', 'IF', 'TEMP', 'TEMPORARY', 'UNLOGGED',
]);
const TOP_LEVEL = new Set([
    'SELECT', 'FROM', 'WHERE', 'SET', 'GROUP BY', 'ORDER BY',
    'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES',
    'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE',
    'DROP TABLE', 'CREATE INDEX', 'UNION', 'UNION ALL',
    'RETURNING', 'WITH',
]);
const MAJOR_KW = new Set([
    'SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING',
    'LIMIT', 'OFFSET', 'INSERT', 'UPDATE', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'UNION', 'VALUES',
    'SET', 'RETURNING', 'WITH', 'INTO',
]);
// ─── Tokenizer ─────────────────────────────────────────────────────
function tokenize(sql) {
    const tokens = [];
    let i = 0;
    const len = sql.length;
    while (i < len) {
        const ch = sql[i];
        // Whitespace
        if (/\s/.test(ch)) {
            let ws = '';
            while (i < len && /\s/.test(sql[i])) {
                if (sql[i] === '\n') {
                    tokens.push({ type: 'newline', value: '\n' });
                    i++;
                    ws = '';
                }
                else {
                    ws += sql[i];
                    i++;
                }
            }
            if (ws)
                tokens.push({ type: 'whitespace', value: ws });
            continue;
        }
        // Line comment --
        if (ch === '-' && sql[i + 1] === '-') {
            let val = '--';
            i += 2;
            while (i < len && sql[i] !== '\n') {
                val += sql[i];
                i++;
            }
            tokens.push({ type: 'comment', value: val });
            continue;
        }
        // Block comment /* */
        if (ch === '/' && sql[i + 1] === '*') {
            let val = '/*';
            i += 2;
            while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
                val += sql[i];
                i++;
            }
            if (i < len) {
                val += '*/';
                i += 2;
            }
            tokens.push({ type: 'comment', value: val });
            continue;
        }
        // String literals
        if (ch === "'" || ch === '"') {
            const quote = ch;
            let val = quote;
            i++;
            while (i < len) {
                if (sql[i] === quote) {
                    val += quote;
                    i++;
                    if (sql[i] === quote) {
                        val += quote;
                        i++;
                        continue;
                    } // escaped
                    break;
                }
                val += sql[i];
                i++;
            }
            tokens.push({ type: quote === "'" ? 'string' : 'identifier', value: val });
            continue;
        }
        // Numbers
        if (/\d/.test(ch) || (ch === '.' && /\d/.test(sql[i + 1] ?? ''))) {
            let val = '';
            while (i < len && /[\d.eE]/.test(sql[i])) {
                val += sql[i];
                i++;
            }
            tokens.push({ type: 'number', value: val });
            continue;
        }
        // Identifiers / keywords
        if (/[a-zA-Z_]/.test(ch)) {
            let val = '';
            while (i < len && /[\w$]/.test(sql[i])) {
                val += sql[i];
                i++;
            }
            const upper = val.toUpperCase();
            tokens.push({
                type: KEYWORDS.has(upper) ? 'keyword' : 'identifier',
                value: val,
            });
            continue;
        }
        // Operators
        if (ch === '<' || ch === '>' || ch === '=' || ch === '!') {
            let val = ch;
            i++;
            if (i < len && (sql[i] === '=' || sql[i] === '>')) {
                val += sql[i];
                i++;
            }
            tokens.push({ type: 'operator', value: val });
            continue;
        }
        if (ch === '|' && sql[i + 1] === '|') {
            tokens.push({ type: 'operator', value: '||' });
            i += 2;
            continue;
        }
        // Punctuation
        if ('(),.;:*+/-%'.includes(ch)) {
            tokens.push({ type: 'punctuation', value: ch });
            i++;
            continue;
        }
        tokens.push({ type: 'other', value: ch });
        i++;
    }
    return tokens;
}
// ─── Formatter ─────────────────────────────────────────────────────
function isKeyword(t, kw) {
    return t.type === 'keyword' && t.value.toUpperCase() === kw.toUpperCase();
}
function keywordVal(kw, uppercase) {
    return uppercase ? kw.toUpperCase() : kw.toLowerCase();
}
function format(sql, options = {}) {
    const { indent = '  ', uppercase = true, linesBetweenQueries = 2, commaPosition = 'after', } = options;
    const tokens = tokenize(sql);
    const out = [];
    let depth = 0;
    let newline = true; // at start of line
    let afterComma = false;
    function emit(s) { out.push(s); }
    function emitLine() { emit('\n'); newline = true; afterComma = false; }
    function emitIndent() { for (let d = 0; d < depth; d++)
        emit(indent); newline = false; }
    function emitSpace() { emit(' '); newline = false; }
    function kw(k) { return keywordVal(k, uppercase); }
    let i = 0;
    while (i < tokens.length) {
        const t = tokens[i];
        // Skip whitespace tokens, we manage our own spacing
        if (t.type === 'whitespace') {
            i++;
            continue;
        }
        // Comments: preserve inline, or push to own line
        if (t.type === 'comment') {
            if (!newline)
                emitSpace();
            emit(t.value);
            emitLine();
            i++;
            continue;
        }
        // Semicolons: end of statement
        if (t.type === 'punctuation' && t.value === ';') {
            emit(';');
            emitLine();
            // blank lines between queries
            if (i + 1 < tokens.length) {
                for (let b = 0; b < linesBetweenQueries; b++)
                    emitLine();
            }
            i++;
            continue;
        }
        // Top-level major keywords
        if (t.type === 'keyword' && MAJOR_KW.has(t.value.toUpperCase())) {
            const upper = t.value.toUpperCase();
            // Special: "GROUP BY" and "ORDER BY"
            if ((upper === 'GROUP' || upper === 'ORDER') &&
                i + 2 < tokens.length && isKeyword(tokens[i + 2], 'BY')) {
                if (!newline) {
                    emitLine();
                }
                if (newline)
                    emitIndent();
                emit(kw(upper));
                emitSpace();
                emit(kw('BY'));
                emitSpace();
                i += 3; // skip whitespace token after BY
                continue;
            }
            if (upper === 'UNION') {
                emitLine();
                if (newline)
                    emitIndent();
                emit(kw('UNION'));
                i++;
                // check for ALL
                if (i + 1 < tokens.length && isKeyword(tokens[i + 1], 'ALL')) {
                    emitSpace();
                    emit(kw('ALL'));
                    i += 2;
                }
                emitLine();
                continue;
            }
            if (upper === 'INSERT') {
                if (!newline) {
                    emitLine();
                }
                if (newline)
                    emitIndent();
                emit(kw('INSERT'));
                emitSpace();
                i++;
                // skip whitespace
                while (i < tokens.length && tokens[i].type === 'whitespace')
                    i++;
                // INTO
                if (i < tokens.length && isKeyword(tokens[i], 'INTO')) {
                    emit(kw('INTO'));
                    emitSpace();
                    i++;
                }
                continue;
            }
            if (upper === 'DELETE') {
                if (!newline) {
                    emitLine();
                }
                if (newline)
                    emitIndent();
                emit(kw('DELETE'));
                emitSpace();
                i++;
                // skip whitespace
                while (i < tokens.length && tokens[i].type === 'whitespace')
                    i++;
                if (i < tokens.length && isKeyword(tokens[i], 'FROM')) {
                    emit(kw('FROM'));
                    emitSpace();
                    i++;
                }
                continue;
            }
            if (!newline) {
                emitLine();
            }
            if (newline)
                emitIndent();
            emit(kw(upper));
            emitSpace();
            i++;
            continue;
        }
        // CASE ... WHEN ... THEN ... ELSE ... END
        if (isKeyword(t, 'CASE')) {
            if (newline)
                emitIndent();
            emit(kw('CASE'));
            depth++;
            i++;
            continue;
        }
        if (isKeyword(t, 'WHEN')) {
            emitLine();
            emitIndent();
            emit(kw('WHEN'));
            emitSpace();
            i++;
            continue;
        }
        if (isKeyword(t, 'THEN')) {
            emitSpace();
            emit(kw('THEN'));
            emitSpace();
            i++;
            continue;
        }
        if (isKeyword(t, 'ELSE')) {
            emitLine();
            emitIndent();
            emit(kw('ELSE'));
            emitSpace();
            i++;
            continue;
        }
        if (isKeyword(t, 'END')) {
            depth--;
            emitLine();
            emitIndent();
            emit(kw('END'));
            i++;
            continue;
        }
        // Parentheses
        if (t.type === 'punctuation' && t.value === '(') {
            // Check for subquery or function call
            emit('(');
            // Look ahead: if next meaningful token is SELECT, it's a subquery
            let j = i + 1;
            while (j < tokens.length && tokens[j].type === 'whitespace')
                j++;
            if (j < tokens.length && isKeyword(tokens[j], 'SELECT')) {
                depth++;
                emitLine();
            }
            i++;
            continue;
        }
        if (t.type === 'punctuation' && t.value === ')') {
            // If we're in a subquery context, decrease depth
            if (depth > 0 && out.length > 0) {
                // Check if we were in subquery
                let prevNonWs = out.length - 1;
                while (prevNonWs >= 0 && (out[prevNonWs] === ' ' || out[prevNonWs] === '\n' || out[prevNonWs] === indent)) {
                    prevNonWs--;
                }
                const lastContent = out.slice(Math.max(0, out.length - 20)).join('');
                if (lastContent.includes('\n') && lastContent.includes(indent)) {
                    depth--;
                    emitLine();
                    emitIndent();
                }
            }
            emit(')');
            i++;
            continue;
        }
        // Commas in SELECT list
        if (t.type === 'punctuation' && t.value === ',') {
            if (commaPosition === 'before') {
                emitLine();
                emitIndent();
                emit(',');
                emitSpace();
            }
            else {
                emit(',');
                emitLine();
                emitIndent();
            }
            afterComma = true;
            i++;
            continue;
        }
        // Default: emit token with proper spacing
        if (newline)
            emitIndent();
        else if (afterComma || t.type !== 'operator')
            emitSpace();
        if (t.type === 'keyword') {
            emit(kw(t.value));
        }
        else {
            emit(t.value);
        }
        newline = false;
        afterComma = false;
        i++;
    }
    return out.join('').trim() + '\n';
}
// ─── CLI ───────────────────────────────────────────────────────────
function formatFile(input, options = {}) {
    return format(input, options);
}
