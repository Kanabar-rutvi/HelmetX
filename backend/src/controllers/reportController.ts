import { Request, Response } from 'express';
import DailyReport from '../models/DailyReport';
import SiteSafetyReport from '../models/SiteSafetyReport';
import AuditLog from '../models/AuditLog';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
  user?: any;
}

const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const createMyReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { task, imageData, materials } = req.body;
    const date = formatDate(new Date());

    let imageUrl: string | undefined;

    if (imageData && typeof imageData === 'string' && imageData.includes('base64')) {
      const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const b64 = match[2];
        const ext = mime.split('/')[1];
        const uploadsDir = path.resolve('uploads', 'reports');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const filename = `${userId}_${date}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, Buffer.from(b64, 'base64'));
        imageUrl = `/uploads/reports/${filename}`;
      }
    }

    const report = await DailyReport.findOneAndUpdate(
      { user: userId, date },
      { task, imageUrl, materials: materials || [] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyTodayReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const date = formatDate(new Date());
    const report = await DailyReport.findOne({ user: userId, date });
    res.json(report || null);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const reports = await DailyReport.find({ user: userId }).sort({ date: -1 }).limit(30);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const { items } = req.body;
    const report = await DailyReport.findOne({ _id: id, user: userId });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.materials = [...report.materials, ...(items || [])];
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { items } = req.body;
    const date = formatDate(new Date());
    const report = await DailyReport.findOneAndUpdate(
      { user: userId, date },
      { $push: { materials: { $each: items || [] } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Admin: Get all reports with filters
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId, siteId, approvalStatus } = req.query as { startDate?: string; endDate?: string; userId?: string; siteId?: string; approvalStatus?: string };
    let query: any = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (userId) {
      query.user = userId;
    }

    if (siteId) {
      const User = (await import('../models/User')).default;
      const users = await User.find({ assignedSite: siteId }).select('_id');
      query.user = { $in: users.map(u => u._id) };
    }

    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    const reports = await DailyReport.find(query)
      .populate('user', 'name email employeeId assignedSite')
      .sort({ date: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Restored Functions
export const getMaterialsStats = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;
    const userId = authReq.user?._id;
    const { siteId } = req.query as { siteId?: string };
    let userFilter: any = {};
    
    if (role === 'worker') {
      userFilter.user = userId;
    } else if (role === 'supervisor') {
      userFilter.user = authReq.user?.assignedSite
        ? { $in: (await (await import('../models/User')).default.find({ assignedSite: authReq.user.assignedSite }).select('_id')).map(u => u._id) }
        : undefined;
    } else if (role === 'admin') {
      if (siteId) {
        userFilter.user = { $in: (await (await import('../models/User')).default.find({ assignedSite: siteId }).select('_id')).map(u => u._id) };
      }
    }
    
    const reports = await DailyReport.find(userFilter).select('materials');
    const materials = reports.flatMap((r: any) => (r.materials || []).map((m: any) => ({ ...m, status: m.status || 'requested' })));
    const total = materials.length;
    const pending = materials.filter((m: any) => m.status === 'requested').length;
    const approved = materials.filter((m: any) => m.status === 'approved').length;
    res.json({ total, pending, approved });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMaterialsList = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const role = authReq.user?.role;
    const userId = authReq.user?._id;
    const { siteId } = req.query as { siteId?: string };
    let userFilter: any = {};
    
    if (role === 'worker') {
      userFilter.user = userId;
    } else if (role === 'supervisor') {
      userFilter.user = authReq.user?.assignedSite
        ? { $in: (await (await import('../models/User')).default.find({ assignedSite: authReq.user.assignedSite }).select('_id')).map(u => u._id) }
        : undefined;
    } else if (role === 'admin') {
      if (siteId) {
        userFilter.user = { $in: (await (await import('../models/User')).default.find({ assignedSite: siteId }).select('_id')).map(u => u._id) };
      }
    }
    
    const reports = await DailyReport.find(userFilter)
      .select('materials date user')
      .populate('user', 'name');
    
    const items = reports.flatMap((r: any) => 
      (r.materials || []).map((m: any) => ({
        _id: m._id,
        name: m.name,
        quantity: m.quantity,
        note: m.note,
        status: m.status || 'requested',
        date: r.date,
        user: r.user,
        reportId: r._id
      }))
    ).sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const approveReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await DailyReport.findByIdAndUpdate(id, { approvalStatus: status, approvedAt: new Date() });
    res.json({ message: 'Report updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateMaterialStatus = async (req: Request, res: Response) => {
  try {
    const { reportId, materialId } = req.params as { reportId: string; materialId: string };
    const { status } = req.body as { status: 'requested' | 'approved' | 'rejected' | 'delivered' };

    if (!['requested', 'approved', 'rejected', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await DailyReport.findOneAndUpdate(
      { _id: reportId, 'materials._id': materialId },
      { $set: { 'materials.$[m].status': status } },
      { new: true, arrayFilters: [{ 'm._id': materialId }] }
    );

    if (!updated) return res.status(404).json({ message: 'Material item not found' });
    
    try {
      const io = (req.app.get('io') as import('socket.io').Server | undefined);
      io?.emit('materials_updated', { reportId, materialId, status });
    } catch {/* noop */}
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getReportsPending = async (req: Request, res: Response) => {
  try {
    const reports = await DailyReport.find({ approvalStatus: 'pending' }).populate('user', 'name');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMaterialsPending = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId } = req.query as { siteId?: string };

    let userFilter: any = {};
    if (req.user?.role === 'supervisor') {
      const User = (await import('../models/User')).default;
      const users = await User.find({ assignedSite: req.user.assignedSite }).select('_id name');
      userFilter.user = { $in: users.map(u => u._id) };
    } else if (siteId) {
      const User = (await import('../models/User')).default;
      const users = await User.find({ assignedSite: siteId }).select('_id name');
      userFilter.user = { $in: users.map(u => u._id) };
    }

    const reports = await DailyReport.find(userFilter)
      .select('materials date user')
      .populate('user', 'name');

    const pendingItems = reports.flatMap((r: any) => 
      (r.materials || [])
        .filter((m: any) => m.status === 'requested')
        .map((m: any) => ({
          _id: m._id,
          name: m.name,
          quantity: m.quantity,
          note: m.note,
          status: m.status,
          date: r.date,
          user: r.user,
          reportId: r._id
        }))
    );

    res.json(pendingItems);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getSiteSafetyReports = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, date } = req.query;
    let query: any = {};
    if (siteId) query.site = siteId;
    if (date) query.date = date;

    // Access Control: If supervisor, only show assigned site
    if (req.user?.role === 'supervisor') {
      query.site = req.user.assignedSite;
    }

    const reports = await SiteSafetyReport.find(query).sort({ date: -1 }).limit(30);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
