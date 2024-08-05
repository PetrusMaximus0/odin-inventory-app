const pool = require('./pool');

const getAll = async () => {
	try {
		const { rows } = await pool.query(
			'SELECT * FROM items ORDER BY name ASC'
		);
		return rows;
	} catch (error) {
		console.error('Error fetching items: ', error);
		throw error;
	}
};

const getById = async (id) => {
	try {
		const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [
			id,
		]);
		return rows;
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

const deleteById = async (categoryId) => {
	try {
		// Remove all the category references to the items
		await pool.query(` DELETE FROM item_categories WHERE category_id = $1`, [
			categoryId,
		]);

		// Remove the category
		await pool.query(` DELETE FROM categories WHERE id = $1 `, [categoryId]);
	} catch (error) {
		console.error('Error deleting category: ', error);
		throw error;
	}
};

const updateById = async (categoryId, name, description) => {
	try {
		await pool.query(
			`
        UPDATE categories
        SET name = $1, description = $2
        WHERE id = $3`,
			[name, description, categoryId]
		);
	} catch (error) {
		console.error('Error while updating a category: ', error);
		throw error;
	}
};

const getItemCategories = async (itemId) => {
	try {
		const query = `
			SELECT categories.* from categories
			JOIN item_categories
			ON categories.id = item_categories.category_id
			WHERE item_categories.item_id = $1
		`;
		await pool.query(query, [itemId]);
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
