import { parseSQL } from './src/utils/sqlParser.js';

const testSQL = `
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    role_id INT
);

CREATE TABLE roles (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);

ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles (id);
`;

const result = parseSQL(testSQL);
console.log(JSON.stringify(result, null, 2));

if (result.tables.length === 2 && result.tables.find(t => t.name === 'users').columns.find(c => c.fk)) {
    console.log("✅ Parser Test Passed");
} else {
    console.error("❌ Parser Test Failed");
    process.exit(1);
}
