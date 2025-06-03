const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/userController');
const { 
    getUsers, 
    getUser, 
    blockUser, 
    unblockUser, 
    createUser, 
    updateUser, 
    deleteUser 
} = require('../../controllers/admin/userController');

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/block', blockUser);
router.put('/:id/unblock', unblockUser);
router.delete('/:id', deleteUser);

module.exports = router;