const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload');
const productController = require('../../controllers/admin/productController');

const { 
    getProducts, 
    getProduct, 
    approveProduct, 
    rejectProduct, 
    deleteProduct 
} = require('../../controllers/admin/productController');

router.post('/', upload.array('images', 5), productController.createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id/approve', approveProduct);
router.put('/:id/reject', rejectProduct);
router.delete('/:id', deleteProduct);

module.exports = router;