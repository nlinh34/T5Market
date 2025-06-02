// routes/admin/orders.js:
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.get('/:id/edit', orderController.getEditOrderData); 
router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/payment', orderController.updatePaymentStatus); 
router.delete('/:id', orderController.deleteOrder);

module.exports = router;
