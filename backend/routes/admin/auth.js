const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/authController');
const { redirectIfAuthenticated } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { requireAuth } = require('../../middleware/auth');
const productController = require('../../controllers/admin/productController');


router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('admin/auth/login', {
        title: 'Đăng nhập Admin',
        layout: 'layouts/auth'
    });
});

router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/', 
    requireAuth,
    upload.array('images', 5), 
    productController.createProduct
);


module.exports = router;