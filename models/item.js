// Imports / requires
const mongoose = require('mongoose');

// Create the schema for Item
const ItemSchema = mongoose.Schema({
	// an id will be automatically generated
	name: { type: String, required: true, maxLenght: 100 },
	description: { type: String, required: true, maxLenght: 250 },
	category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
	units_in_stock: { type: mongoose.SchemaTypes.Number },
});

// Set up a virtual for url
ItemSchema.virtual('url').get(function () {
	return `/catalog/items/${this._id}`;
});

module.exports = mongoose.model('Item', ItemSchema);
