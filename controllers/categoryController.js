const { body, validationResult } = require('express-validator');

//
const db = require('../db/queries');

// Open page with list of categories page
exports.category_list = async function (req, res, next) {
	try {
		const allCategories = await db.getCategories();

		allCategories.forEach((element) => {
			element.url = `/catalog/categories/${element.id}`;
		});

		res.render('category_list', { categories: allCategories });
	} catch (error) {
		return next(error);
	}
};

// Open page with list of all items in a category
exports.category_detail = async function (req, res, next) {
	try {
		const [category, itemsInCategory] = await Promise.all([
			db.getCategoryById(req.params.id),
			db.getItemsInCategory(req.params.id),
		]);

		if (category === null) res.sendStatus(404);

		category.url = `/catalog/categories/${category.id}`;

		itemsInCategory.forEach((element) => {
			element.url = `/catalog/items/${element.id}`;
		});

		res.render('item_list', {
			title: `Category: ${category.name}`,
			items: itemsInCategory,
		});
	} catch (error) {
		return next(error);
	}
};

// Open form for a new category
exports.category_new_get = async function (req, res, next) {
	try {
		res.render('category_form');
	} catch (error) {
		return next(error);
	}
};

// Post form for a new category
exports.category_new_post = [
	// Validate and sanitize fields
	body('name').trim().isLength({ min: 3, max: 20 }).escape(),
	body('description')
		.optional({ values: 'falsy' })
		.trim()
		.isLength({ max: 200 })
		.escape(),

	// Process request after validation and trimmed data
	async function (req, res, next) {
		try {
			// Extract the errors
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				// The form has errors, Render the form again with filled fields and error messages.
				res.render('category_form', {
					name: req.body.name,
					description: req.body.description,
					errors: errors.array(),
				});
			} else {
				//Data from the form is valid. Save the new category
				await db.insertCategory(req.body.name, req.body.description);
				res.redirect('/catalog/categories');
			}
		} catch (error) {
			return next(error);
		}
	},
];

//
exports.category_delete_get = async function (req, res) {
	try {
		// Search for all items in this category
		const [category, allItemsInCategory] = await Promise.all([
			db.getCategoryById(req.params.id),
			db.getItemsInCategory(req.params.id),
		]);

		if (category === null) {
			// Category hasn't been found
			res.redirect('/catalog/categories');
			return;
		}

		res.render('category_delete', {
			category: category,
			allItemsInCategory: allItemsInCategory,
		});
	} catch (error) {
		return next(error);
	}
};

//
exports.category_delete_post = async function (req, res, next) {
	try {
		await db.deleteCategoryById(req.params.id);
		res.redirect('/catalog/categories');
	} catch (error) {
		console.error('Error deleting category', error);
		return next(error);
	}
};

//
exports.category_update_get = async function (req, res, next) {
	try {
		const category = await db.getCategoryById(req.params.id);

		if (category === null) {
			throw new Error("Couldn't find the category!");
		}

		res.render('category_form', {
			name: category.name,
			description: category.description,
		});
	} catch (error) {
		return next(error);
	}
};

exports.category_update_post = [
	// Verify And sanitize
	body('name').trim().isLength({ min: 3, max: 20 }).escape(),
	body('description')
		.optional((values = 'falsy'))
		.trim()
		.isLength({ max: 200 })
		.escape(),

	async function (req, res, next) {
		try {
			// Take the errors out if they exist
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				// There are Errors, render the form again with sanitized values and errors
				res.render('category_form', {
					name: req.body.name,
					description: req.body.description,
					errors: errors,
				});
			} else {
				// Proceed updating the document
				await db.updateCategoryById(
					req.params.id,
					req.body.name,
					req.body.description
				);
				res.redirect('/catalog/categories');
			}
		} catch (error) {
			return next(error);
		}
	},
];
