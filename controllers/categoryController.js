const Category = require('../models/category');

exports.category_list = async function (req, res, next) {
	try {
		const allCategories = await Category.find({}).sort({ name: 1 }).exec();
		res.render('category_list', { categories: allCategories });
	} catch (error) {
		return next(error);
	}
};
