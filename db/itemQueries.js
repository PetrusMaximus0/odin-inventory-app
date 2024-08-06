const pool = require('./pool');

const getAll = async () => {
	try {
		const { rows } = await pool.query(
			`SELECT
				items.*,
				json_agg(json_build_object(
					'id', categories.id,
					'name', categories.name,
					'description', categories.description,
					'url', '/catalog/categories/' || categories.id
					)) AS category,
				'url' , '/catalog/items/' || items.id AS url
			FROM items
			LEFT JOIN item_categories ON items.id = item_categories.item_id
			LEFT JOIN categories ON item_categories.category_id = categories.id
			GROUP BY
				items.id
			ORDER BY
				items.name ASC`
		);
		return rows;
	} catch (error) {
		console.error('Error fetching items: ', error);
		throw error;
	}
};

const getById = async (id) => {
	try {
		const { rows } = await pool.query(
			`SELECT
				items.*,
				json_agg(json_build_object(
					'id', categories.id,
					'name', categories.name,
					'description', categories.description,
					'url', '/catalog/categories/' || categories.id
					)) AS category,
				'url' , '/catalog/items/' || items.id AS url
			FROM items
			LEFT JOIN item_categories ON items.id = item_categories.item_id
			LEFT JOIN categories ON item_categories.category_id = categories.id
			WHERE items.id = $1
			GROUP BY items.id
			ORDER BY items.name ASC
			`,
			[id]
		);
		return rows[0];
	} catch (error) {
		console.error('Error fetching item: ', error);
		throw error;
	}
};

const insert = async (item) => {
	const client = await pool.connect();
	try {
		// Start a transaction
		await client.query('BEGIN');

		// Insert into the items table
		const { rows } = await client.query(
			`
            INSERT INTO items (name, description, units_in_stock, price)
            VALUES ($1, $2, $3, $4)
			RETURNING id
            `,
			[item.name, item.description, item.units_in_stock, item.price]
		);

		//
		if (item.category.length > 0) {
			//insert references to categories into the item_categories table
			const values = [];
			const placeholders = [];

			// Build a single query
			for (let i = 0, j = 1; i < item.category.length; i++, j += 2) {
				placeholders.push(`($${j}, $${j + 1})`);
				values.push(rows[0].id, item.category[i]);
			}

			const query = `INSERT INTO item_categories(item_id, category_id) VALUES ${placeholders.join(
				', '
			)}`;

			await client.query(query, values);
		}

		// Commit the transaction
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error inserting item: ', error);
		throw error;
	} finally {
		client.release();
	}
};

const deleteById = async (id) => {
	const client = await pool.connect();
	try {
		// Start a transaction
		await client.query('BEGIN');

		// Remove all the category references to the items
		await client.query(`DELETE FROM item_categories WHERE item_id = $1`, [
			id,
		]);

		// Remove the item
		await client.query(`DELETE FROM items WHERE id = $1 `, [id]);

		// Commit the transaction
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error deleting item: ', error);
		throw error;
	} finally {
		client.release();
	}
};

const updateById = async (id, item) => {
	// Definitely do a transaction HERE
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Update the item entry
		await client.query(
			`
			UPDATE items
			SET name = $2, description = $3, units_in_stock = $4, price = $5
			WHERE id = $1`,
			[id, item.name, item.description, item.units_in_stock, item.price]
		);

		// Insert new categories if they don't exist for this item.
		if (item.category.length > 0) {
			const insertValues = [];
			const placeholders = [];

			// Build a single query to insert categories that aren't in the item.
			for (let i = 0, j = 1; i < item.category.length; i++, j += 2) {
				placeholders.push(`($${j}, $${j + 1})`);
				insertValues.push(id, item.category[i]);
			}

			// Insert new categories
			await client.query(
				`
				INSERT INTO item_categories (item_id, category_id)
				VALUES ${placeholders.join(', ')}
				ON CONFLICT (item_id, category_id) DO NOTHING`,
				insertValues
			);

			// Remove categories not in the updated category list.
			const deletePlaceholders = item.category
				.map((_, index) => `$${index + 2}`)
				.join(', ');

			//
			await client.query(
				`
				DELETE FROM item_categories
				WHERE item_id = $1
				AND category_id NOT IN (${deletePlaceholders})`,
				[id, ...item.category]
			);
			//
		} else {
			// Delete all the categories
			await client.query(
				`
				DELETE FROM item_categories
				WHERE item_categories.item_id = $1`,
				[id]
			);
		}
		await client.query('COMMIT');
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('Error while updating item: ', error);
		throw error;
	} finally {
		client.release();
	}
};

const getItemCategories = async (id) => {
	try {
		const query = `
			SELECT categories.* from categories
			JOIN item_categories
			ON categories.id = item_categories.category_id
			WHERE item_categories.item_id = $1
		`;
		const { rows } = await pool.query(query, [id]);
		return rows;
	} catch (error) {
		console.error('Error fetching item categories: ', error);
		throw error;
	}
};
module.exports = {
	getAll,
	getById,
	insert,
	deleteById,
	updateById,
	getItemCategories,
};
