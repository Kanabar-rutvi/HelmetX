import { Request, Response } from 'express';
import Alert from '../models/Alert';
import Notification from '../models/Notification';
import User from '../models/User';
import Site from '../models/Site';
import { logAction } from '../services/auditService';

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private/Admin
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { status, type, startDate, endDate, severity } = req.query;
    
    let query: any = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const alerts = await Alert.find(query)
      .populate('user', 'name email employeeId')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .sort({ timestamp: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// @desc    Get alert statistics
// @route   GET /api/alerts/stats
// @access  Private/Admin
export const getAlertStats = async (req: Request, res: Response) => {
  try {
    const total = await Alert.countDocuments();
    const active = await Alert.countDocuments({ status: { $ne: 'resolved' } });
    const critical = await Alert.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } });
    const resolved = await Alert.countDocuments({ status: 'resolved' });
    
    // Group by type
    const byType = await Alert.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({ total, active, critical, resolved, byType });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// @desc    Update alert status (acknowledge/resolve)
// @route   PUT /api/alerts/:id
// @access  Private/Admin
export const updateAlertStatus = async (req: any, res: Response) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    
    if (status === 'acknowledged') {
      alert.acknowledgedBy = req.user._id;
      alert.acknowledgedAt = new Date();
    } else if (status === 'resolved') {
      alert.resolvedBy = req.user._id;
      alert.resolvedAt = new Date();
    }

    await alert.save();
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// @desc    Create manual alert (for testing)
// @route   POST /api/alerts
// @access  Private/Admin
export const createAlert = async (req: Request, res: Response) => {
  try {
    const { type, deviceId, severity, message, userId } = req.body;
    
    const alert = await Alert.create({
      type,
      deviceId,
      severity,
      value: message,
      user: userId,
      status: 'new',
      timestamp: new Date()
    });

    const io = req.app.get('io');
    
    // Workflow Logic
    try {
        const user = userId ? await User.findById(userId) : null;
        const siteId = user?.assignedSite;

        // 1. Notify Worker (Low Severity)
        if (severity === 'low' && userId) {
            await Notification.create({
                recipient: userId,
                type: 'info',
                title: 'Alert',
                message: message || `New alert: ${type}`,
                read: false
            });
            // io.to(userId).emit('alert', alert); // Assuming user joins room by ID
        }

        // 2. Notify Supervisors (Medium+)
        if (['medium', 'high', 'critical'].includes(severity) && siteId) {
            const site = await Site.findById(siteId);
            if (site && site.supervisors && site.supervisors.length > 0) {
                const notifs = site.supervisors.map((supId: any) => ({
                    recipient: supId,
                    type: severity === 'critical' ? 'error' : 'warning',
                    title: `Site Alert: ${type}`,
                    message: `New ${severity} alert at ${site.name}: ${message || type}`,
                    read: false,
                    link: `/supervisor`
                }));
                await Notification.insertMany(notifs);

                site.supervisors.forEach((supId: any) => {
                    io.to(supId.toString()).emit('new_alert', alert);
                });
            }
        }

        // 3. Notify Admin (High/Critical)
        if (['high', 'critical'].includes(severity)) {
             const admins = await User.find({ role: 'admin' });
             if (admins.length > 0) {
                 const notifs = admins.map(admin => ({
                     recipient: admin._id,
                     type: 'error',
                     title: `CRITICAL ALERT: ${type}`,
                     message: `Critical incident reported: ${message || type}`,
                     read: false
                 }));
                 await Notification.insertMany(notifs);
                 
                 admins.forEach(admin => {
                     io.to(admin._id.toString()).emit('new_alert', alert);
                 });
             }
        }

    } catch (workflowError) {
        console.error('Workflow Error:', workflowError);
        // Don't fail the request if notifications fail, just log it
    }

    // Audit Log for manual creation
    if ((req as any).user?._id) {
        await logAction((req as any).user._id, 'CREATE_ALERT_MANUAL', 'Alert', alert._id.toString(), `Manual alert: ${type}`);
    }

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
