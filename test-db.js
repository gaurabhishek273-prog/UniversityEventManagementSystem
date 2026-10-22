const db = require('./config/database');

async function testDatabase() {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS database_name'
        );

        console.log('Database connected successfully!');
        console.log(rows);
    } catch (error) {
        console.error('Database connection failed:');
        console.error(error.message);
    } finally {
        process.exit();
    }
}

testDatabase();