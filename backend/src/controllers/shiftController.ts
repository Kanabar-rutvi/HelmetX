import { Request, Response } from 'express';
import Shift from '../models/Shift';

export const getShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await Shift.find().populate('siteId', 'name');
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shifts' });
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    const shift = new Shift(req.body);
    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error creating shift' });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Error updating shift' });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shift' });
  }
};
