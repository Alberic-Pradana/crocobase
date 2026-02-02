export const parseSQL = (sqlContent) => {
    const tables = [];
    const lines = sqlContent.split('\n');

    let currentTable = null;

    // Basic Regex parsers
    const createTableRegex = /CREATE\s+TABLE\s+["`]?(\w+)["`]?/i;
    const columnRegex = /^\s*["`]?(\w+)["`]?\s+([A-Z0-9()]+)/i; // Matches "name VARCHAR(255)"
    const pkRegex = /PRIMARY\s+KEY/i;
    const fkRegex = /FOREIGN\s+KEY\s*\((["`]?\w+["`]?)\)\s*REFERENCES\s+["`]?(\w+)["`]?\s*\((["`]?\w+["`]?)\)/i;
    const alterFkRegex = /ALTER\s+TABLE\s+["`]?(\w+)["`]?\s+ADD\s+FOREIGN\s+KEY\s*\((["`]?\w+["`]?)\)\s*REFERENCES\s+["`]?(\w+)["`]?\s*\((["`]?\w+["`]?)\)/i;

    // We might want a more robust parser (block based) instead of line based, 
    // but let's try a simple state machine approach for the MVP.

    // Clean comments
    const cleanedSQL = sqlContent.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // Split by statements (;)
    const statements = cleanedSQL.split(';');

    statements.forEach(statement => {
        const trimmed = statement.trim();
        if (!trimmed) return;

        if (createTableRegex.test(trimmed)) {
            const match = trimmed.match(createTableRegex);
            const tableName = match[1];

            const table = {
                name: tableName,
                columns: [],
                position: { x: 0, y: 0 } // Defaults, will be arranged later
            };

            // Extract content inside parenthesis
            const contentMatch = trimmed.match(/\(([\s\S]*)\)/);
            if (contentMatch) {
                const body = contentMatch[1];
                // Split columns by comma, handling nested parenthesis (like DECIMAL(10,2))
                // Simple split by comma might fail on types with comma.
                // Let's try splitting by comma that is NOT inside parenthesis.
                const parts = body.split(/,(?![^(]*\))/);

                parts.forEach(part => {
                    part = part.trim();
                    if (!part) return;

                    // Check for inline constraints or full column defs
                    if (pkRegex.test(part) && /PRIMARY\s+KEY\s*\((.+)\)/i.test(part)) {
                        // PRIMARY KEY (id) - table level constraint
                        const pkMatch = part.match(/PRIMARY\s+KEY\s*\((["`]?\w+["`]?)\)/i);
                        if (pkMatch) {
                            const pkCol = pkMatch[1];
                            const col = table.columns.find(c => c.name === pkCol);
                            if (col) col.pk = true;
                        }
                    } else if (fkRegex.test(part)) {
                        // FOREIGN KEY (col) REFERENCES refTable(refCol)
                        const fkMatch = part.match(fkRegex);
                        if (fkMatch) {
                            const colName = fkMatch[1];
                            const refTable = fkMatch[2];
                            const refCol = fkMatch[3];
                            const col = table.columns.find(c => c.name === colName);
                            if (col) {
                                col.fk = true;
                                col.fkReference = `${refTable}.${refCol}`;
                            }
                        }
                    } else {
                        // Assume column definition: name type ...
                        const colMatch = part.match(columnRegex);
                        if (colMatch) {
                            const colName = colMatch[1];
                            const colType = colMatch[2];
                            const isPk = /PRIMARY\s+KEY/i.test(part);
                            const isUnique = /UNIQUE/i.test(part);
                            const isNotNull = /NOT\s+NULL/i.test(part);

                            // Check inline FK: REFERENCES table(col)
                            let fkRef = null;
                            const inlineFkMatch = part.match(/REFERENCES\s+["`]?(\w+)["`]?\s*\((["`]?\w+["`]?)\)/i);
                            if (inlineFkMatch) {
                                fkRef = `${inlineFkMatch[1]}.${inlineFkMatch[2]}`;
                            }

                            table.columns.push({
                                name: colName,
                                type: colType,
                                pk: isPk,
                                fk: !!fkRef,
                                fkReference: fkRef,
                                nullable: !isNotNull,
                                unique: isUnique
                            });
                        }
                    }
                });
            }
            tables.push(table);
        } else if (alterFkRegex.test(trimmed)) {
            // ALTER TABLE ... ADD FOREIGN KEY
            const match = trimmed.match(alterFkRegex);
            const tableName = match[1];
            const colName = match[2];
            const refTable = match[3];
            const refCol = match[4];

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
