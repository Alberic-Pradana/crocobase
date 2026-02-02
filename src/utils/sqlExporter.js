export const generateSQL = (nodes) => {
    let sql = "";

    // Sort tables? Or just list them. FK constraints might require ordering or ALTER TABLE.
    // For simplicity, we create tables first then add constraints, or use inline if possible.
    // But circular dependencies prefer ALTER TABLE.
    // Let's generate CREATE TABLE with columns, then ALTER TABLE for FKs.

    // 1. CREATE TABLEs
    nodes.forEach(node => {
        const table = node.data;
        sql += `CREATE TABLE ${table.name} (\n`;

        const cols = table.columns.map(col => {
            let line = `  ${col.name} ${col.type}`;
            if (col.pk) line += " PRIMARY KEY";
            if (!col.nullable && !col.pk) line += " NOT NULL";
            if (col.unique) line += " UNIQUE";
            return line;
        });

        sql += cols.join(",\n");
        sql += "\n);\n\n";
    });

    // 2. Add Foreign Keys via ALTER TABLE to avoid ordering issues
    nodes.forEach(node => {
        const table = node.data;
        table.columns.forEach(col => {
            if (col.fk && col.fkReference) {
                // fkReference: "table.column"
                const [refTable, refCol] = col.fkReference.split('.');
                if (refTable && refCol) {
                    sql += `ALTER TABLE ${table.name} ADD FOREIGN KEY (${col.name}) REFERENCES ${refTable} (${refCol});\n`;
                }
            }
        });
    });

    return sql;
};

export const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
