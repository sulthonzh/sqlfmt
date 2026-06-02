# sqlfmt

Zero-dependency SQL formatter and pretty printer.

Formats SQL queries with consistent indentation, keyword casing, and line breaks. Works with SELECT, INSERT, UPDATE, DELETE, JOINs, subqueries, CTEs, CASE/WHEN, UNION, window functions, and more.

## Why

You paste a minified SQL query from a log file and need to read it. Or your team writes SQL in a dozen different styles and you want one consistent format. `sqlfmt` just works — pipe it in, get clean SQL out.

## Install

```bash
npm install -g sqlfmt
```

## Usage

```bash
# Pipe SQL in
echo "SELECT id,name,email FROM users WHERE active=1" | sqlfmt

# Format a file
sqlfmt query.sql

# Format in place
sqlfmt -i query.sql

# Check if formatted (CI mode — exits 1 if needs formatting)
sqlfmt --check schema.sql

# Custom options
sqlfmt --indent 4 --lowercase query.sql
sqlfmt --comma-before query.sql    # leading comma style
sqlfmt --tab query.sql             # tabs instead of spaces
```

## Programmatic API

```typescript
import { format } from 'sqlfmt';

const sql = "SELECT id, name FROM users WHERE active = 1 ORDER BY name";
const formatted = format(sql, {
  indent: '    ',       // 4 spaces
  uppercase: true,      // keywords uppercase
  commaPosition: 'after', // trailing comma (default)
});

console.log(formatted);
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--indent <n>` | 2 | Spaces per indent level |
| `--tab` | spaces | Use tabs |
| `--uppercase` | yes | Keywords in uppercase |
| `--lowercase` | — | Keywords in lowercase |
| `--comma-before` | after | Leading comma style |
| `--comma-after` | after | Trailing comma style (default) |
| `--lines-between <n>` | 2 | Blank lines between queries |
| `-i, --in-place` | — | Format file in place |
| `--check` | — | Check formatting (CI mode) |

## Example

**Input:**
```sql
select u.id, u.name, o.total from users u left join orders o on u.id = o.user_id where u.active = 1 and o.created_at > '2024-01-01' group by u.id, u.name order by o.total desc limit 10
```

**Output:**
```sql
SELECT
  u.id,
  u.name,
  o.total
FROM
  users u
  LEFT JOIN orders o
    ON u.id = o.user_id
WHERE
  u.active = 1
  AND o.created_at > '2024-01-01'
GROUP BY
  u.id,
  u.name
ORDER BY
  o.total DESC
LIMIT 10
```

## Features

- **Zero dependencies** — only needs Node.js >= 18
- **Smart keyword detection** — knows SQL keywords vs identifiers
- **Comment preservation** — line and block comments kept intact
- **Multiple statement support** — separates queries with blank lines
- **CI mode** — `--check` exits with code 1 if formatting needed
- **Programmatic API** — use in your own tools
- **Flexible style** — uppercase/lowercase, tabs/spaces, comma position

## License

MIT
