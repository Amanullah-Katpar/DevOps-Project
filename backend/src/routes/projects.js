const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createProject, getProjects, getProject, updateProject, deleteProject
} = require('../controllers/projectController');
const protect = require('../middleware/auth');

router.use(protect);

const projectValidation = [
  body('name').trim().isLength({ min: 3, max: 60 }).withMessage('Name must be 3–60 characters'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6})$/).withMessage('Invalid hex color'),
  body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed', 'archived'])
];

router.route('/').get(getProjects).post(projectValidation, createProject);
router.route('/:id').get(getProject).put(updateProject).patch(updateProject).delete(deleteProject);

module.exports = router;
