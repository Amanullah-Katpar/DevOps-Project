const { validationResult } = require('express-validator');
const Task = require('../models/Task');

// ─── Create Task ──────────────────────────────────────────────────────────────
exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, message: 'Task created', task });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Tasks (for current user) ────────────────────────────────────────
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, project, page = 1, limit = 20 } = req.query;
    const filter = { owner: req.user.id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project) filter.project = project;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('project', 'name color'),
      Task.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Task ──────────────────────────────────────────────────────────
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id })
      .populate('project', 'name color');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ─── Update Task ──────────────────────────────────────────────────────────────
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task updated', task });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Task ──────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Get Task Statistics ──────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Task.countDocuments({ owner: req.user.id });
    const overdue = await Task.countDocuments({
      owner: req.user.id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    });

    res.json({
      success: true,
      stats: {
        total,
        overdue,
        byStatus: stats,
        byPriority: priorityStats
      }
    });
  } catch (error) {
    next(error);
  }
};
