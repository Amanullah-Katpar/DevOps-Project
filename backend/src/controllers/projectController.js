const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');

// ─── Create Project ───────────────────────────────────────────────────────────
exports.createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const project = await Project.create({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, message: 'Project created', project });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Projects ─────────────────────────────────────────────────────────
exports.getProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {
      $or: [{ owner: req.user.id }, { members: req.user.id }]
    };
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .sort({ updatedAt: -1 })
      .populate('owner', 'username email')
      .populate('members', 'username email');

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (proj) => {
        const taskCount = await Task.countDocuments({ project: proj._id });
        const completedCount = await Task.countDocuments({ project: proj._id, status: 'done' });
        const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
        return { ...proj.toJSON(), taskCount, completedCount, progress };
      })
    );

    res.json({ success: true, count: projects.length, projects: projectsWithCounts });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Project ───────────────────────────────────────────────────────
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .populate({ path: 'tasks', options: { sort: { createdAt: -1 } } });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isOwnerOrMember =
      project.owner._id.toString() === req.user.id ||
      project.members.some((m) => m._id.toString() === req.user.id);

    if (!isOwnerOrMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// ─── Update Project ───────────────────────────────────────────────────────────
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not authorized' });
    }
    res.json({ success: true, message: 'Project updated', project });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Project ───────────────────────────────────────────────────────────
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not authorized' });
    }

    // Unlink tasks from deleted project
    await Task.updateMany({ project: req.params.id }, { project: null });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
