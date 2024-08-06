const { Pool } = require('pg');

const connectionStringLocal =
	'postgresql://petrus:48hfresh@localhost:5432/inventory_app';

const pool =
	process.env.NODE_ENV === 'production'
		? new Pool({
				host: process.env.PGHOST,
				database: process.env.PGDATABASE,
				username: process.env.PGUSER,
				password: process.env.PGPASSWORD,
				port: 5432,
				ssl: {
					require: true,
				},
		  })
		: new Pool({ connectionString: connectionStringLocal });

const getPgVersion = async () => {
	const client = await pool.connect();
	try {
		const result = await client.query('SELECT version()');
		console.log(result.rows[0]);
	} finally {
		client.release();
	}
};

getPgVersion();

module.exports = pool;
