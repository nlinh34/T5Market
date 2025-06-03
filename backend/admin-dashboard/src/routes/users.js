const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

// Route to get all users
router.get('/', authMiddleware.isAuthenticated, userController.getAllUsers);

// Route to get a specific user by ID
router.get('/:id', authMiddleware.isAuthenticated, userController.getUserById);

// Route to create a new user
router.post('/', authMiddleware.isAuthenticated, userController.createUser);

// Route to update an existing user
router.put('/:id', authMiddleware.isAuthenticated, userController.updateUser);

// Route to delete a user
router.delete('/:id', authMiddleware.isAuthenticated, userController.deleteUser);

module.exports = router;