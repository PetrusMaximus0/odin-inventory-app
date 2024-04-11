const Category = require('../models/category');
const Item = require('../models/item');

exports.category_list = async function (req, res, next) {
	try {
		const allCategories = await Category.find({}).sort({ name: 1 }).exec();
		res.render('category_list', { categories: allCategories });
	} catch (error) {
		return next(error);
	}
};

exports.category_detail = async function (req, res, next) {
	try {
		const [category, itemsInCategory] = await Promise.all([
			Category.findById(req.params.id).exec(),
			Item.find({ category: req.params.id })
				.populate('category')
				.sort({ name: 1 })
				.exec(),
		]);

		console.log(category.name);
		res.render('item_list', {
			title: `Category: ${category.name}`,
			items: itemsInCategory,
		});
	} catch (error) {
		return next(error);
	}
};
