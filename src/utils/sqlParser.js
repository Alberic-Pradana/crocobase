export const parseSQL = (sqlContent) => {
    const tables = [];

    // Remove comments
    const cleanedSQL = sqlContent.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // Split by statements (;)
    const statements = cleanedSQL.split(';');

    // Regex Definitions
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?/i;
    const columnRegex = /^\s*["`]?(\w+)["`]?\s+([A-Z0-9()]+)/i;
    const pkRegex = /PRIMARY\s+KEY\s*\(([^)]+)\)/i;
    const fkRegex = /FOREIGN\s+KEY\s*\((["`]?\w+["`]?)\)\s*REFERENCES\s+["`]?(\w+)["`]?\s*\((["`]?\w+["`]?)\)/i;
    const constraintFkRegex = /CONSTRAINT\s+["`]?\w+["`]?\s+FOREIGN\s+KEY\s*\((["`]?\w+["`]?)\)\s*REFERENCES\s+["`]?(\w+)["`]?\s*\((["`]?\w+["`]?)\)/i;

    const alterAddFkRegex = /ALTER\s+TABLE\s+["`]?(\w+)["`]?\s+ADD\s+(?:CONSTRAINT\s+["`]?\w+["`]?\s+)?FOREIGN\s+KEY\s*\((["`]?\w+["`]?)\)\s*REFERENCES\s+["`]?(\w+)["`]?\s*\((["`]?\w+["`]?)\)/i;

    statements.forEach(statement => {
        const trimmed = statement.trim();
        if (!trimmed) return;

        // Ignore common non-table statements
        if (
            /^SET\s+/i.test(trimmed) ||
            /^USE\s+/i.test(trimmed) ||
            /^CREATE\s+DATABASE/i.test(trimmed) ||
            /^DROP\s+TABLE/i.test(trimmed) ||
            /^INSERT\s+INTO/i.test(trimmed) ||
            /^\/\*!/i.test(trimmed)
        ) {
            return;
        }

        if (createTableRegex.test(trimmed)) {
            const match = trimmed.match(createTableRegex);
            const tableName = match[1];

            const table = {
                name: tableName,
                columns: [],
                position: { x: 0, y: 0 }
            };

            const contentMatch = trimmed.match(/\(([\s\S]*)\)/);
            if (contentMatch) {
                // Determine the end of the columns definition part.
                // Sometimes CREATE TABLE ends with options like ENGINE=InnoDB...
                // The regex `/\(([\s\S]*)\)/` greedily matches the last closing parenthesis.
                // Assuming the last closing parenthesis closes the table definition. 
                // But in `) ENGINE=...`, the last `)` is part of the table body closure.
                // Wait, `match(/\(([\s\S]*)\)/)` gets everything from first ( to last ).
                // If nested parenthesis exist (like for decimal(10,2)), it should be fine.
                // But if the schema has `) ENGINE=...`, the last `)` might be interpreted correctly or not depending on if there are other parenthesis.
                // Usually `CREATE TABLE (...) ENGINE=...;`
                // My regex `/\(([\s\S]*)\)/` grabs contents. If `master3.sql` has `) ENGINE=...;`, the last `)` is what we want.
                // However, `CREATE TABLE t ( ... ) ENGINE=...` -> match will be everything inside `( ... )`.

                // Let's rely on the fact that we split statements by `;`.
                // So trimmed is `CREATE TABLE ... (...) ENGINE=...`
                // We need to find the matching closing parenthesis for the opening one.
                // For MVP simplicity, let's stick to the current greedy match but maybe refine if needed.
                // Actually, `master3.sql` has `) ENGINE=InnoDB...`. The last `)` in the statement is NOT the table closing usually? 
                // `CREATE TABLE ... ( ... ) ENGINE=...;` -> The last char before ; is usually not `)`.
                // So `trimmed.match(/\(([\s\S]*)\)[^\)]*$/)` or similar. 

                // Better approach: extract content between first `(` and `) ENGINE` or just last `)`.
                // Let's assume the standard `CREATE TABLE tbl ( body ) ...`

                let body = contentMatch[1];

                // If body ends with quote or something, clean it? 
                // Actually, the regex `\(([\s\S]*)\)` takes everything between first and LAST `)`.
                // If `ENGINE=InnoDB` follows, it is outside the last `)`.
                // So `body` is correct.

                const parts = body.split(/,(?![^(]*\))/);

                parts.forEach(part => {
                    part = part.trim();
                    if (!part) return;

                    // Parse parts
                    if (pkRegex.test(part) && !/^PRIMARY\s+KEY/i.test(part)) {
                        // Line contains PRIMARY KEY but not starting with it? e.g. `id int PRIMARY KEY`
                        // handled in column parsing
                    }

                    if (/^PRIMARY\s+KEY/i.test(part)) {
                        // Table level PK
                        const pkMatch = part.match(pkRegex);
                        if (pkMatch) {
                            // might be composite `(col1, col2)`
                            const pkCols = pkMatch[1].split(',').map(s => s.trim().replace(/["`]/g, ''));
                            pkCols.forEach(pkCol => {
                                const col = table.columns.find(c => c.name === pkCol);
                                if (col) col.pk = true;
                            });
                        }
                    } else if (constraintFkRegex.test(part)) {
                        // CONSTRAINT ... FOREIGN KEY
                        const fkMatch = part.match(constraintFkRegex);
                        if (fkMatch) {
                            const colName = fkMatch[1].replace(/["`]/g, '');
                            const refTable = fkMatch[2].replace(/["`]/g, '');
                            const refCol = fkMatch[3].replace(/["`]/g, '');
                            const col = table.columns.find(c => c.name === colName);
                            if (col) {
                                col.fk = true;
                                col.fkReference = `${refTable}.${refCol}`;
                            }
                        }
                    } else if (fkRegex.test(part)) {
                        // Standard FOREIGN KEY
                        const fkMatch = part.match(fkRegex);
                        if (fkMatch) {
                            const colName = fkMatch[1].replace(/["`]/g, '');
                            const refTable = fkMatch[2].replace(/["`]/g, '');
                            const refCol = fkMatch[3].replace(/["`]/g, '');
                            const col = table.columns.find(c => c.name === colName);
                            if (col) {
                                col.fk = true;
                                col.fkReference = `${refTable}.${refCol}`;
                            }
                        }
                    } else if (/^KEY\s+/i.test(part) || /^UNIQUE\s+KEY/i.test(part)) {
                        // Ignore indexes for now
                    } else {
                        // Column definition
                        const colMatch = part.match(columnRegex);
                        if (colMatch) {
                            const colName = colMatch[1];
                            const colType = colMatch[2];

                            const isPk = /PRIMARY\s+KEY/i.test(part);
                            const isUnique = /UNIQUE/i.test(part) || /UNIQUE\s+KEY/i.test(part); // simplistic
                            const isNotNull = /NOT\s+NULL/i.test(part);

                            // Inline FK?
                            let fkRef = null;
                            // ... existing inline FK logic if needed, usually MySQL uses CONSTRAINT for FKs.

                            table.columns.push({
                                name: colName,
                                type: colType,
                                pk: isPk,
                                fk: false, // will sit true if CONSTRAINT found later
                                fkReference: null,
                                nullable: !isNotNull,
                                unique: isUnique
                            });
                        }
                    }
                });
            }
            tables.push(table);
        } else if (alterAddFkRegex.test(trimmed)) {
            const match = trimmed.match(alterAddFkRegex);
            const tableName = match[1];
            const colName = match[2].replace(/["`]/g, '');
            const refTable = match[3].replace(/["`]/g, '');
            const refCol = match[4].replace(/["`]/g, '');

            const table = tables.find(t => t.name === tableName);
            if (table) {
                const col = table.columns.find(c => c.name === colName);
                if (col) {
                    col.fk = true;
                    col.fkReference = `${refTable}.${refCol}`;
                }
            }
        }
    });

    return { tables };
};
