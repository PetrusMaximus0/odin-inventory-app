const { body, validationResult } = require('express-validator');
const itemQueries = require('../db/itemQueries');
const categoryQueries = require('../db/categoryQueries');

// List items
exports.item_list = async function (req, res, next) {
	try {
		const allItems = await itemQueries.getAll();
		res.render('item_list', { title: 'All items', items: allItems });
	} catch (error) {
		return next(error);
	}
};

// Read an item
exports.item_detail = async function (req, res, next) {
	try {
		const item = await itemQueries.getById(req.params.id);
		res.render('item_detail', { item: item });
	} catch (error) {
		return next(error);
	}
};

// Create an item GET
exports.item_new_get = async function (req, res, next) {
	try {
		const allCategories = await categoryQueries.getAll();
		res.render('item_form', { allCategories: allCategories });
	} catch (error) {
		return next(error);
	}
};

// Create an item POST
exports.item_new_post = [
	// Validate and sanitize fields
	body('name').trim().isLength({ min: 1, max: 100 }).escape(),
	body('description')
		.optional({ values: 'falsy' })
		.trim()
		.isLength({ max: 250 })
		.escape(),
	body('category.*').escape(),
	body('units_in_stock')
		.trim()
		.isNumeric()
		.withMessage('Units in stock must be a number.')
		.escape(),
	body('price')
		.trim()
		.isNumeric()
		.withMessage('Price must be a number.')
		.escape(),

	//
	async function (req, res, next) {
		try {
			// Extract errors, if they exist.
			const errors = validationResult(req);

			// Create a new item based on the form values
			const newItem = {
				name: req.body.name,
				description: req.body.description,
				category:
					typeof req.body.category === 'undefined'
						? []
						: Array.isArray(req.body.category)
						? req.body.category
						: [req.body.category],
				units_in_stock: req.body.units_in_stock,
				price: req.body.price,
			};

			if (!errors.isEmpty()) {
				// There are errors, render the form again with the sanitized values and errors.
				const allCategories = await categoryQueries.getAll();
				res.render('item_form', {
					item: newItem,
					allCategories: allCategories,
					errors: errors,
				});
			} else {
				// No errors. Save the new item
				await itemQueries.insert(newItem);
				res.redirect('/catalog/items');
			}
		} catch (error) {
			return next(error);
		}
	},
];

// Update an item GET
exports.item_update_get = async function (req, res, next) {
	try {
		const [item, checkedCategories, allCategories] = await Promise.all([
			itemQueries.getById(req.params.id),
			itemQueries.getItemCategories(req.params.id),
			categoryQueries.getAll(),
		]);

		if (item === null) {
			const error = new Error("Couldn't find Item!");
			return next(error);
		}

		// A Set will give significantly better performance with larger sets of data while trading off more memory used.
		const checkedCategoriesSet = new Set(
			checkedCategories.map((category) => category.id)
		);

		// Mark categories that are part of this item as checked
		allCategories.forEach((category) => {
			category.checked = checkedCategoriesSet.has(category.id);
		});

		res.render('item_form', {
			item: item,
			allCategories: allCategories,
		});
	} catch (error) {
		return next(error);
	}
};

// Update an item POST
exports.item_update_post = [
	// Validate and Sanitize the values
	body('name').trim().isLength({ max: 100 }).escape(),
	body('description')
		.optional({ values: 'falsy' })
		.trim()
		.isLength({ max: 250 })
		.escape(),
	body('category.*').escape(),
	body('units_in_stock')
		.trim()
		.isNumeric()
		.withMessage('Units in stock must be a number.')
		.escape(),
	body('price')
		.trim()
		.isNumeric()
		.withMessage('Price must be a number.')
		.escape(),

	//
	async function (req, res, next) {
		try {
			// Extract the errors if any exist
			const errors = validationResult(req);
			const newItem = {
				name: req.body.name,
				description: req.body.description,
				category:
					typeof req.body.category === 'undefined'
						? []
						: Array.isArray(req.body.category)
						? req.body.category
						: [req.body.category],
				units_in_stock: req.body.units_in_stock,
				price: req.body.price,
			};

			if (!errors.isEmpty()) {
				//There are errors, render the form again with sanitized values and errors.
				const allCategories = await categoryQueries.getAll();

				// Mark categories that are part of this item as checked
				allCategories.forEach((category) => {
					category.checked = req.body.category.includes(category.id);
				});

				//
				res.render('item_form', {
					item: newItem,
					allCategories: allCategories,
					errors: errors,
				});
			} else {
				// Update the item
				await itemQueries.updateById(req.params.id, newItem);

				res.redirect(`/catalog/items/${req.params.id}/detail`);
			}
		} catch (error) {
			return next(error);
		}
	},
];

// Delete an item GET
exports.item_delete_get = async function (req, res, next) {
	try {
		const item = await itemQueries.getById(req.params.id);

		if (item === null) {
			const err = new Error("Couldn't find the item");
			return next(err);
		}

		res.render('item_delete', { name: item.name });
	} catch (error) {
		return next(error);
	}
};

// Delete an item POST
exports.item_delete_post = async function (req, res, next) {
	try {
		if (req.body.password === process.env.DELETE_PASSWORD) {
			await itemQueries.deleteById(req.params.id);
			res.redirect('/catalog/items');
		} else {
			const item = await itemQueries.getById(req.params.id);
			if (item === null)
				throw new Error(`Couldn't find the item with id: ${req.params.id}`);
			res.render('item_delete', {
				error: 'Wrong password',
				name: item.name,
			});
		}
	} catch (error) {
		return next(error);
	}
};
