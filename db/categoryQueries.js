const pool = require('./pool');

const getAll = async () => {
	try {
		const { rows } = await pool.query(
			`SELECT
				categories.*,
				'url' , '/catalog/categories/' || categories.id AS url			
			FROM categories
			ORDER BY categories.name ASC`
		);
		return rows;
	} catch (error) {
		console.error('Error fetching categories: ', error);
		throw error;
	}
};

const getById = async (id) => {
	try {
		const { rows } = await pool.query(
			`SELECT
				categories.*,
				'url' , '/catalog/categories/' || categories.id AS url
			FROM categories
			WHERE id = $1`,
			[id]
		);
		return rows[0];
	} catch (error) {
		console.error('Error fetching category: ', error);
		throw error;
	}
};

// Fetch a list of items of the category with the given category id.
const getItemsInCategory = async (categoryId) => {
	try {
		const { rows } = await pool.query(
			`
            SELECT
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
            WHERE item_categories.category_id = $1
			GROUP BY items.id
			ORDER BY items.name ASC`,
			[categoryId]
		);

		return rows;
	} catch (error) {
		console.error('Error fetching list of items by category: ', error);
		throw error;
	}
};

const insert = async (name, description) => {
	try {
		await pool.query(
			`
            INSERT INTO categories (name, description)
            VALUES ($1, $2)
            `,
			[name, description]
		);
	} catch (error) {
		console.error('Error inserting category: ', error);
		throw error;
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

module.exports = {
	getAll,
	getById,
	getItemsInCategory,
	insert,
	deleteById,
	updateById,
};
