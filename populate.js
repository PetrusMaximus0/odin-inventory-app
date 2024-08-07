const pool = require('./db/pool');

const itemsQuery = `
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name VARCHAR (100) NOT NULL,
        description VARCHAR(250),
        units_in_stock INTEGER,
        price INTEGER NOT NULL
    );

    INSERT INTO items (name, description, units_in_stock, price)
    VALUES
        ('G3A3', '7.62x52mm NATO.', 20, 100),
        ('Colt 45', '.45 Cal handgun for self defense.', 100, 100),
        ('Integrated Head Protection System (IHPS)', 'Protection from pistol-fired projectiles and fragmentation.', 50, 100),
        ('Beretta M9', '9mm automatic pistol', 25, 100);
    `;

const categoryQuery = `
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(250)
    );

    INSERT INTO categories (name, description)
    VALUES
        ('Battlerifles', 'Rifles suited for medium to long distance engagements.'),
        ('Handguns', 'Personal defense weapons capable of one handed operation.'),
        ('Protective Gear', 'Gear designed to protect the operator.'),
        ('Firearms', 'Arms firing gunpowder propelled projectiles.')
`;

const itemsCatQuery = `
    CREATE TABLE IF NOT EXISTS item_categories (
        item_id INTEGER REFERENCES items (id),
        category_id INTEGER REFERENCES categories(id),
        PRIMARY KEY (item_id, category_id)
    );

    INSERT INTO item_categories (item_id, category_id)
    VALUES
        (1, 1), (1, 4), (2, 2), (2, 4), (3, 3), (4, 2), (4, 4)

`;

async function main() {
	console.log('Seeding...');
	const client = await pool.connect();

	try {
		await client.query('BEGIN');
		await client.query(`DROP TABLE IF EXISTS items CASCADE`);
		await client.query(`DROP TABLE IF EXISTS categories CASCADE`);
		await client.query(`DROP TABLE IF EXISTS item_categories CASCADE`);
		await client.query(itemsQuery);
		await client.query(categoryQuery);
		await client.query(itemsCatQuery);
		await client.query('COMMIT');
		console.log('done');
	} catch (error) {
		console.error(error);
		await client.query('ROLLBACK');
	} finally {
		client.release();
	}
}

main();
