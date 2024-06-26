const Item = require('../models/item');
const Category = require('../models/category');
const { body, validationResult } = require('express-validator');

// List items
exports.item_list = async function (req, res, next) {
	try {
		const allItems = await Item.find({})
			.sort({ name: 1 })
			.populate('category')
			.exec();
		res.render('item_list', { title: 'All items', items: allItems });
	} catch (error) {
		return next(error);
	}
};

// Read an item
exports.item_detail = async function (req, res, next) {
	try {
		const item = await Item.findById(req.params.id)
			.populate('category')
			.exec();
		res.render('item_detail', { item: item });
	} catch (error) {
		return next(error);
	}
};

// Create an item GET
exports.item_new_get = async function (req, res, next) {
	try {
		const allCategories = await Category.find({}).exec();
		res.render('item_form', { allCategories: allCategories });
	} catch (error) {
		return next(error);
	}
};
// Create an item POST
exports.item_new_post = [
	// Convert the category to an array
	(req, res, next) => {
		if (!Array.isArray(req.body.category)) {
			req.body.genre =
				typeof req.body.genre === 'undefined' ? [] : [req.body.genre];
		}
		next();
	},
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
			const newItem = new Item({
				name: req.body.name,
				description: req.body.description,
				category: req.body.category,
				units_in_stock: req.body.units_in_stock,
				price: req.body.price,
			});

			if (!errors.isEmpty()) {
				// There are errors, render the form again with the sanitized values and errors.
				const allCategories = await Category.find({}).exec();
				res.render('item_form', {
					item: newItem,
					allCategories: allCategories,
					errors: errors,
				});
			} else {
				// No errors. Save the new item
				await newItem.save();
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
		const [item, allCategories] = await Promise.all([
			Item.findById(req.params.id).exec(),
			Category.find().sort({ name: 1 }).exec(),
		]);

		if (item === null) {
			const error = new Error("Couldn't find Item!");
			return next(error);
		}

		// Mark categories that are part of this item as checked
		allCategories.forEach((category) => {
			if (item.category.includes(category._id)) category.checked = true;
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

			// Create a new object with the old id for replacing the document.
			const newItem = new Item({
				name: req.body.name,
				description: req.body.description,
				category:
					typeof req.body.category === 'undefined'
						? []
						: req.body.category,
				units_in_stock: req.body.units_in_stock,
				price: req.body.price,
				_id: req.params.id,
			});
			//
			if (!errors.isEmpty()) {
				//There are errors, render the form again with sanitized values and errors.
				const allCategories = await Category.find()
					.sort({ name: 1 })
					.exec();

				// Mark categories that are part of this item as checked
				allCategories.forEach((category) => {
					if (newItem.category.includes(category._id))
						category.checked = true;
				});

				res.render('item_form', {
					item: {
						name: req.body.name,
						description: req.body.description,
						category:
							typeof req.body.category === 'undefined'
								? []
								: req.body.category,
						units_in_stock: req.body.units_in_stock,
						price: req.body.price,
					},
					allCategories: allCategories,
					errors: errors,
				});
				return;
			} else {
				console.log('Updating item...');
				await Item.findByIdAndUpdate(req.params.id, newItem);
				res.redirect('/catalog/items');
			}
		} catch (error) {
			return next(error);
		}
	},
];

// Delete an item GET
exports.item_delete_get = async function (req, res, next) {
	try {
		const item = await Item.findById(req.params.id).exec();

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
			await Item.findByIdAndDelete(req.params.id).exec();
			res.redirect('/catalog/items');
		} else {
			const item = await Item.findById(req.params.id).exec();
			if (item === null) {
				const err = new Error("Couldn't find the item");
				return next(err);
			}
			res.render('item_delete', {
				error: 'Wrong password',
				name: item.name,
			});
		}
	} catch (error) {
		return next(error);
	}
};
