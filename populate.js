#! /usr/bin/env node

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const Category = require('./models/category');
const Item = require('./models/item');
const categories = [];
const items = [];

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
	console.log('Debug: About to connect');
	await mongoose.connect(mongoDB);
	console.log('Debug: Should be connected?');
	//
	await createCategories();
	await createItems();
	//
	console.log('Debug: Closing mongoose');
	mongoose.connection.close();
}

// We pass the index to the ...Create functions so that, for example,
// genre[0] will always be the Fantasy genre, regardless of the order
// in which the elements of promise.all's argument complete.
async function categoryCreate(index, name, description) {
	const category = new Category({
		name: name,
		description: description,
	});
	await category.save();
	categories[index] = category;
	console.log(`Added category: ${name}`);
}

async function createCategories() {
	console.log('Adding categories');
	await Promise.all([
		categoryCreate(
			0,
			'Battle Rifle',
			'A rifle suited for medium to long distance engagements.'
		),
		categoryCreate(
			1,
			'Handgun',
			'A personal defense weapon capable of one handed operation.'
		),
		categoryCreate(
			2,
			'Protective Gear',
			'Gear designed to protect the operator'
		),
	]);
}

async function itemCreate(index, data) {
	const item = new Item({
		name: data.name,
		description: data.description,
		category: data.category,
		units_in_stock: data.units_in_stock,
	});

	await item.save();
	items[index] = item;
	console.log(`Added item: ${data.name}`);
}

async function createItems() {
	console.log('Adding Items...');

	const rifles = {
		name: 'G3A3',
		description: '7.62x52mm NATO',
		category: categories[0],
		units_in_stock: 20,
	};

	const colt45 = {
		name: 'Colt 45',
		description: '.45 Cal handgun for self defense',
		category: categories[1],
		units_in_stock: 100,
	};
	const helmets = {
		name: 'BH-A2',
		description: 'Ballistic Helmet with a low profile',
		category: categories[2],
		units_in_stock: 50,
	};

	const beretta = {
		name: 'Beretta M9',
		description: '9mm automatic pistol',
		category: categories[1],
		units_in_stock: 25,
	};

	await Promise.all([
		itemCreate(0, rifles),
		itemCreate(1, colt45),
		itemCreate(2, helmets),
		itemCreate(3, beretta),
	]);
}
