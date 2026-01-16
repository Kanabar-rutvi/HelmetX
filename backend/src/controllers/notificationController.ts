import { Request, Response } from 'express';
import Notification from '../models/Notification';

interface AuthRequest extends Request {
  user?: any;
}

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    
    const notification = await Notification.findOne({ _id: id, recipient: userId });
    if (!notification) return res.status(404).json({ message: 'Not found' });
    
    notification.read = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Internal use or for testing
export const createNotification = async (req: Request, res: Response) => {
    try {
        const { recipientId, title, message, type } = req.body;
        const notification = await Notification.create({
            recipient: recipientId,
            title,
            message,
            type: type || 'info'
        });
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
