const pool = require('../models/db');

async function testDBQuery() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully at:', result.rows[0].now);
    } catch (error) {
        console.error('❌ Failed to connect or query database:', error);
    }
}

testDBQuery();