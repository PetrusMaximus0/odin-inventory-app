const pool = require('./pool');

const getCategories = async () => {
	try {
		const { rows } = await pool.query(
			'SELECT * FROM categories ORDER BY name ASC'
		);
		return rows;
	} catch (error) {
		console.error('Error fetching categories: ', error);
		throw new Error('Error fetching categories');
	}
};

const getCategoryById = async (id) => {
	try {
		const { rows } = await pool.query(
			'SELECT * FROM categories WHERE id = $1',
			[id]
		);
		return rows;
	} catch (error) {
		console.error('Error fetching category: ', error);
		throw new Error('Error fetching category');
	}
};

// Fetch a list of items of the category with the given category id.
const getItemsInCategory = async (categoryId) => {
	try {
		const { rows } = await pool.query(
			`
            SELECT items.*  
            FROM items
            JOIN item_categories
            ON items.id = item_categories.item_id
            WHERE item_categories.category_id = $1`,
			[categoryId]
		);

		return rows;
	} catch (error) {
		console.log('Error fetching list of items by category: ', error);
		throw new Error('Error fetching items in category');
	}
};

module.exports = {
	getCategories,
	getCategoryById,
	getItemsInCategory,
};
