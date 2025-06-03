const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const categoryRoutes = require('./categories');
const orderRoutes = require('./orders');
const productRoutes = require('./products');
const userRoutes = require('./users');

// Define the main route for the application
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Use the defined routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);

module.exports = router;