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

//
router.get('/categories/:id/items', categoryController.category_detail);

// Item Routes
router.get('/items', itemController.item_list);

module.exports = router;
