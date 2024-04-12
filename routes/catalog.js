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
router.get('/categories', categoryController.category_list);

// List items per category
router.get('/categories/:id/items', categoryController.category_detail);

// Create a new category
router.get('/categories/new', categoryController.category_new_get);
router.post('/categories/new', categoryController.category_new_post);

// Delete a category
router.get('/categories/:id/delete', categoryController.category_delete_get);
router.post('/categories/:id/delete', categoryController.category_delete_post);

// Item Routes
router.get('/items', itemController.item_list);

module.exports = router;
