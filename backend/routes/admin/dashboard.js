const express = require('express');
const router = express.Router();
const { dashboard } = require('../../controllers/admin/dashboardController');

router.get('/', dashboard);

module.exports = router;