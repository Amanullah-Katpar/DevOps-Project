const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createTask, getTasks, getTask, updateTask, deleteTask, getStats
} = require('../controllers/taskController');
const protect = require('../middleware/auth');

// All task routes require authentication
router.use(protect);

const taskValidation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
];

router.get('/stats', getStats);
router.route('/').get(getTasks).post(taskValidation, createTask);
router.route('/:id').get(getTask).put(updateTask).patch(updateTask).delete(deleteTask);

module.exports = router;
