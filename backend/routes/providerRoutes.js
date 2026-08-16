const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { extractSkills } = require('../controllers/providerController');

// POST /api/providers/:id/extract-skills
router.post('/:id/extract-skills', protect, extractSkills);

module.exports = router;
