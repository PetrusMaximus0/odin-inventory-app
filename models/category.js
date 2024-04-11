// Imports \ Requires
const mongoose = require('mongoose');

// Create the schema for category
const CategorySchema = new mongoose.Schema({
	// an id will be automatically generated
	name: { type: String, required: true, maxLenght: 100 },
	description: { type: String, required: true, maxLenght: 250 },
});

// Set up a virtual for url.
CategorySchema.virtual('url').get(function () {
	return `/catalog/category/${this._id}`;
});

module.exports = mongoose.model('Category', CategorySchema);
