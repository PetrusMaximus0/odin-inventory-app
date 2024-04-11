const Item = require('../models/item');
exports.item_list = async function (req, res, next) {
	try {
		const allItems = await Item.find({})
			.sort({ name: 1 })
			.populate('category')
			.exec();
		res.render('item_list', { items: allItems });
	} catch (error) {
		return next(error);
	}
};
