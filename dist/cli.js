#!/usr/bin/env node
"use strict";
/**
 * sqlfmt — SQL formatter CLI
 *
 * Usage:
 *   sqlfmt < input.sql
 *   sqlfmt input.sql
 *   sqlfmt -i input.sql          # in-place
 *   sqlfmt --indent 4 input.sql
 *   sqlfmt --lowercase input.sql
 *   sqlfmt --comma-before input.sql
 *   echo "SELECT * FROM users" | sqlfmt
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const formatter_1 = require("./formatter");
const fs = __importStar(require("fs"));
function parseArgs(argv) {
    const opts = {};
    const files = [];
    let inplace = false;
    let check = false;
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '--indent':
                opts.indent = ' '.repeat(parseInt(argv[++i], 10));
                break;
            case '--tab':
                opts.indent = '\t';
                break;
            case '--lowercase':
                opts.uppercase = false;
                break;
            case '--uppercase':
                opts.uppercase = true;
                break;
            case '--comma-before':
                opts.commaPosition = 'before';
                break;
            case '--comma-after':
                opts.commaPosition = 'after';
                break;
            case '-i':
            case '--in-place':
                inplace = true;
                break;
            case '--check':
                check = true;
                break;
            case '--lines-between':
                opts.linesBetweenQueries = parseInt(argv[++i], 10);
                break;
            case '-h':
            case '--help':
                printHelp();
                process.exit(0);
            case '-v':
            case '--version':
                console.log('sqlfmt v1.0.0');
                process.exit(0);
            default:
                if (!arg.startsWith('-'))
                    files.push(arg);
                break;
        }
    }
    return { files, opts, inplace, check };
}
function printHelp() {
    console.log(`sqlfmt — SQL formatter and pretty printer

Usage:
  sqlfmt [options] [file ...]
  sqlfmt < input.sql

Options:
  --indent <n>       Number of spaces for indentation (default: 2)
  --tab              Use tabs for indentation
  --uppercase        Keywords to uppercase (default)
  --lowercase        Keywords to lowercase
  --comma-before     Comma before column (leading comma style)
  --comma-after      Comma after column (default)
  --lines-between <n>  Blank lines between queries (default: 2)
  -i, --in-place     Format file in place
  --check            Check if file is formatted (exit 1 if not)
  -h, --help         Show this help
  -v, --version      Show version

Examples:
  sqlfmt query.sql
  echo "SELECT * FROM users WHERE id = 1" | sqlfmt
  sqlfmt -i --indent 4 *.sql
  sqlfmt --check schema.sql
`);
}
function main() {
    const { files, opts, inplace, check } = parseArgs(process.argv);
    if (files.length === 0) {
        // Read from stdin
        let input = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => { input += chunk; });
        process.stdin.on('end', () => {
            const result = (0, formatter_1.format)(input, opts);
            if (check) {
                process.exit(input.trim() === result.trim() ? 0 : 1);
            }
            process.stdout.write(result);
        });
        return;
    }
    for (const file of files) {
        const input = fs.readFileSync(file, 'utf8');
        const result = (0, formatter_1.format)(input, opts);
        if (check) {
            if (input.trim() !== result.trim()) {
                console.error(`${file}: needs formatting`);
                process.exit(1);
            }
            console.log(`${file}: ok`);
            continue;
        }
        if (inplace) {
            fs.writeFileSync(file, result, 'utf8');
        }
        else {
            process.stdout.write(result);
        }
    }
}
main();
