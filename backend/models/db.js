const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres', // اسم المستخدم اللي دخلتي فيه
    host: 'localhost',
    database: 'epa_project',
    password: 'Nmer3005',
    port: 5432,
});

module.exports = pool;
