const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// Route to get all orders
router.get('/', authenticate, orderController.getAllOrders);

// Route to get a specific order by ID
router.get('/:id', authenticate, orderController.getOrderById);

// Route to update an order status
router.put('/:id', authenticate, orderController.updateOrderStatus);

// Route to delete an order
router.delete('/:id', authenticate, orderController.deleteOrder);

module.exports = router;