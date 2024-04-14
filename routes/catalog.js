//
const express = require('express');
const router = express.Router();

// Controller modules
const categoryController = require('../controllers/categoryController');
const itemController = require('../controllers/itemController');

// Catalog Route
router.get('/', (req, res, next) => {
	res.render('index', { title: 'Inventory Management Service' });
});

// Category Routes
// List all categories
router.get('/categories', categoryController.category_list);

// List items per category
router.get('/categories/:id/items', categoryController.category_detail);

// Create a new category
router.get('/categories/new', categoryController.category_new_get);
router.post('/categories/new', categoryController.category_new_post);

// Delete a category
router.get('/categories/:id/delete', categoryController.category_delete_get);
router.post('/categories/:id/delete', categoryController.category_delete_post);

// Update a category
router.get('/categories/:id/update', categoryController.category_update_get);
router.post('/categories/:id/update', categoryController.category_update_post);

// Item Routes
// List all items
router.get('/items', itemController.item_list);

// Read an item
router.get('/items/:id/detail', itemController.item_detail);

// Create an item
router.get('/items/new', itemController.item_new_get);
router.post('/items/new', itemController.item_new_post);

// Update an item
router.get('/items/:id/update', itemController.item_update_get);
router.post('/items/:id/update', itemController.item_update_post);

// Delete an item
router.get('/items/:id/delete', itemController.item_delete_get);
router.post('/items/:id/delete', itemController.item_delete_post);

module.exports = router;
