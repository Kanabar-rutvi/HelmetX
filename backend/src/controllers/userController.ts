import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { logAction } from '../services/auditService';

interface AuthRequest extends Request {
  user?: any;
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { siteId, role, employeeId } = req.query;
    
    let query: any = {};
    if (siteId) query.assignedSite = siteId;
    if (role) query.role = role;
    if (employeeId) query.employeeId = employeeId;

    const users = await User.find(query)
      .select('-password')
      .populate('assignedSite', 'name')
      .populate('assignedSupervisor', 'name');
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, employeeId, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    if (employeeId) {
      const idExists = await User.findOne({ employeeId });
      if (idExists) {
        res.status(400).json({ message: 'Employee ID already exists' });
        return;
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      employeeId,
      phone
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Check for duplicate email if being changed
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          res.status(400).json({ message: 'Email already in use' });
          return;
        }
      }

      // Check for duplicate employeeId if being changed
      if (req.body.employeeId && req.body.employeeId !== user.employeeId) {
        const idExists = await User.findOne({ employeeId: req.body.employeeId });
        if (idExists) {
          res.status(400).json({ message: 'Employee ID already in use' });
          return;
        }
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.employeeId = req.body.employeeId || user.employeeId;
      user.phone = req.body.phone || user.phone;
      user.assignedSite = req.body.assignedSite || user.assignedSite;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        assignedSite: updatedUser.assignedSite
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      
      const actorId = (req as AuthRequest).user?._id;
      if (actorId) {
        await logAction(actorId, 'DELETE_USER', 'User', user._id.toString(), `Deleted user ${user.name}`);
      }

      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
