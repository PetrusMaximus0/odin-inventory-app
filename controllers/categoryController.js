const Category = require('../models/category');
const Item = require('../models/item');
const { body, validationResult } = require('express-validator');

// Open page with list of categories page
exports.category_list = async function (req, res, next) {
	try {
		const allCategories = await Category.find({}).sort({ name: 1 }).exec();
		res.render('category_list', { categories: allCategories });
	} catch (error) {
		return next(error);
	}
};

// Open page with list of all items in a category
exports.category_detail = async function (req, res, next) {
	try {
		const [category, itemsInCategory] = await Promise.all([
			Category.findById(req.params.id).exec(),
			Item.find({ category: req.params.id })
				.populate('category')
				.sort({ name: 1 })
				.exec(),
		]);
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

			// Create the category object
			const category = new Category({
				name: req.body.name,
				description: req.body.description,
			});

			if (!errors.isEmpty()) {
				// The form has errors, Render the form again with filled fields and error messages.
				res.render('category_form', {
					name: req.body.name,
					description: req.body.description,
					errors: errors.array(),
				});
			} else {
				//Data from the form is valid. Save the new category
				await category.save();
				res.redirect('/catalog/categories');
			}
		} catch (error) {
			return next(error);
		}
	},
];

//
exports.category_delete_get = async function (req, res, next) {
	// Search for all items in this category
	const [category, allItemsInCategory] = await Promise.all([
		Category.findById(req.params.id).exec(),
		Item.find({ category: req.params.id }, 'name description').exec(),
	]);
	if (category === null) {
		// Category hasn't been found
		res.redirect('/catalog/categories');
	}

	res.render('category_delete', {
		category: category,
		allItemsInCategory: allItemsInCategory,
	});
};

//
exports.category_delete_post = async function (req, res, next) {
	// Search for all items in this category
	try {
		Promise.all([
			Category.findByIdAndDelete(req.params.id).exec(),
			Item.updateMany(
				{ category: req.params.id },
				{ $pull: { category: req.params.id } }
			).exec(),
		]);

		res.redirect('/catalog/categories');
	} catch (error) {
		console.error('Error deleting category', error);
		return next(error);
	}
};

//
exports.category_update_get = async function (req, res, next) {
	try {
		const category = await Category.findById(req.params.id).exec();

		if (category === null) {
			const error = new Error("Couldn't find the category!");
			return next(error);
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
				await Category.findByIdAndUpdate(req.params.id, {
					name: req.body.name,
					description: req.body.description,
					_id: req.params.id,
				});
				res.redirect('/catalog/categories');
			}
		} catch (error) {
			return next(error);
		}
	},
];
