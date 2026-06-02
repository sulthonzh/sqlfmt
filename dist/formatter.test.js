"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatter_1 = require("./formatter");
// ─── Tokenizer tests ───────────────────────────────────────────────
describe('tokenizer', () => {
    test('tokenizes simple SELECT', () => {
        const tokens = (0, formatter_1.tokenize)('SELECT * FROM users');
        expect(tokens.map(t => t.value)).toEqual(['SELECT', ' ', '*', ' ', 'FROM', ' ', 'users']);
    });
    test('identifies keywords', () => {
        const tokens = (0, formatter_1.tokenize)('SELECT id, name FROM users WHERE active = TRUE');
        const keywords = tokens.filter(t => t.type === 'keyword').map(t => t.value);
        expect(keywords).toContain('SELECT');
        expect(keywords).toContain('FROM');
        expect(keywords).toContain('WHERE');
        expect(keywords).toContain('TRUE');
    });
    test('handles string literals', () => {
        const tokens = (0, formatter_1.tokenize)("WHERE name = 'John'");
        const strings = tokens.filter(t => t.type === 'string');
        expect(strings).toHaveLength(1);
        expect(strings[0].value).toBe("'John'");
    });
    test('handles double-quoted identifiers', () => {
        const tokens = (0, formatter_1.tokenize)('SELECT "userId" FROM "UserTable"');
        const ids = tokens.filter(t => t.type === 'identifier');
        expect(ids.some(t => t.value === '"userId"')).toBe(true);
    });
    test('handles line comments', () => {
        const tokens = (0, formatter_1.tokenize)('SELECT 1 -- comment\nFROM dual');
        const comments = tokens.filter(t => t.type === 'comment');
        expect(comments).toHaveLength(1);
        expect(comments[0].value).toBe('-- comment');
    });
    test('handles block comments', () => {
        const tokens = (0, formatter_1.tokenize)('SELECT /* col */ 1');
        const comments = tokens.filter(t => t.type === 'comment');
        expect(comments).toHaveLength(1);
        expect(comments[0].value).toBe('/* col */');
    });
    test('handles numbers', () => {
        const tokens = (0, formatter_1.tokenize)('WHERE price > 19.99');
        const nums = tokens.filter(t => t.type === 'number');
        expect(nums).toHaveLength(1);
        expect(nums[0].value).toBe('19.99');
    });
    test('handles operators', () => {
        const tokens = (0, formatter_1.tokenize)('WHERE a >= 1 AND b != 2');
        const ops = tokens.filter(t => t.type === 'operator').map(t => t.value);
        expect(ops).toContain('>=');
        expect(ops).toContain('!=');
    });
});
// ─── Formatter tests ───────────────────────────────────────────────
describe('formatter', () => {
    test('formats simple SELECT', () => {
        const sql = 'SELECT id, name FROM users WHERE active = 1';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('SELECT');
        expect(result).toContain('FROM');
        expect(result).toContain('WHERE');
        // Each major keyword on its own line
        const lines = result.trim().split('\n');
        expect(lines.length).toBeGreaterThanOrEqual(3);
    });
    test('uppercase keywords by default', () => {
        const result = (0, formatter_1.format)('select id from users');
        expect(result).toContain('SELECT');
        expect(result).toContain('FROM');
    });
    test('lowercase keywords when option set', () => {
        const result = (0, formatter_1.format)('SELECT id FROM users', { uppercase: false });
        expect(result).toContain('select');
        expect(result).toContain('from');
    });
    test('custom indent width', () => {
        const result = (0, formatter_1.format)('SELECT id, name FROM users WHERE active = 1', { indent: '    ' });
        // Output should contain the keyword casing
        expect(result).toContain('SELECT');
        expect(result).toContain('FROM');
        // Multi-line output
        const lines = result.trim().split('\n');
        expect(lines.length).toBeGreaterThanOrEqual(3);
    });
    test('formats INSERT INTO', () => {
        const sql = "INSERT INTO users (id, name) VALUES (1, 'John')";
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('INSERT INTO');
    });
    test('formats UPDATE SET', () => {
        const sql = "UPDATE users SET name = 'Jane' WHERE id = 1";
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('UPDATE');
        expect(result).toContain('SET');
        expect(result).toContain('WHERE');
    });
    test('formats DELETE FROM', () => {
        const sql = 'DELETE FROM users WHERE id = 1';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('DELETE FROM');
        expect(result).toContain('WHERE');
    });
    test('formats GROUP BY and ORDER BY', () => {
        const sql = 'SELECT dept, COUNT(*) FROM users GROUP BY dept ORDER BY dept ASC';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('GROUP BY');
        expect(result).toContain('ORDER BY');
    });
    test('formats JOIN', () => {
        const sql = 'SELECT u.id, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('LEFT');
        expect(result).toContain('JOIN');
        expect(result).toContain('ON');
    });
    test('formats CASE WHEN', () => {
        const sql = "SELECT CASE WHEN age >= 18 THEN 'adult' ELSE 'minor' END AS status FROM users";
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('CASE');
        expect(result).toContain('WHEN');
        expect(result).toContain('THEN');
        expect(result).toContain('ELSE');
        expect(result).toContain('END');
    });
    test('formats multiple statements', () => {
        const sql = 'SELECT 1; SELECT 2;';
        const result = (0, formatter_1.format)(sql);
        const parts = result.split(';');
        expect(parts.length).toBeGreaterThanOrEqual(2);
    });
    test('preserves comments', () => {
        const sql = '-- get active users\nSELECT id FROM users WHERE active = 1';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('-- get active users');
    });
    test('comma before option', () => {
        const sql = 'SELECT id, name, email FROM users';
        const result = (0, formatter_1.format)(sql, { commaPosition: 'before' });
        expect(result).toContain(',');
    });
    test('formats UNION', () => {
        const sql = 'SELECT id FROM users UNION ALL SELECT id FROM admins';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('UNION');
        expect(result).toContain('ALL');
    });
    test('handles empty input', () => {
        const result = (0, formatter_1.format)('');
        expect(result.trim()).toBe('');
    });
    test('handles whitespace-only input', () => {
        const result = (0, formatter_1.format)('   \n\n   ');
        expect(result.trim()).toBe('');
    });
    test('formats subquery', () => {
        const sql = 'SELECT * FROM (SELECT id FROM users) AS active_users';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('SELECT');
        expect(result).toContain('FROM');
    });
    test('formats LIMIT and OFFSET', () => {
        const sql = 'SELECT id FROM users LIMIT 10 OFFSET 20';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('LIMIT');
        expect(result).toContain('OFFSET');
    });
    test('formats HAVING', () => {
        const sql = 'SELECT dept, COUNT(*) FROM users GROUP BY dept HAVING COUNT(*) > 5';
        const result = (0, formatter_1.format)(sql);
        expect(result).toContain('HAVING');
    });
    test('handles escaped quotes in strings', () => {
        const sql = "SELECT * FROM users WHERE name = 'O''Brien'";
        const tokens = (0, formatter_1.tokenize)(sql);
        const strings = tokens.filter(t => t.type === 'string');
        expect(strings).toHaveLength(1);
    });
});
