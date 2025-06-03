const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../middleware/auth');

const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const userRoutes = require('./users');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const categoryRoutes = require('./categories');
const reviewRoutes = require('./reviews');

router.use('/auth', authRoutes);
router.use('/', adminAuth, dashboardRoutes);
router.use('/users', adminAuth, userRoutes);
router.use('/products', adminAuth, productRoutes);
router.use('/orders', adminAuth, orderRoutes);
router.use('/categories', adminAuth, categoryRoutes);
router.use('/reviews', adminAuth, reviewRoutes);

module.exports = router;