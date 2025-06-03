const express = require('express');
const router = express.Router();
const { getReviews, deleteReview } = require('../../controllers/admin/reviewController');

router.get('/', getReviews);
router.delete('/:id', deleteReview);

module.exports = router;