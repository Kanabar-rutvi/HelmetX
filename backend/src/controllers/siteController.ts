import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Site from '../models/Site';
import User from '../models/User';
import Notification from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { logAction } from '../services/auditService';

interface AuthRequest extends Request {
  user?: any;
}

export const getSites = async (req: Request, res: Response) => {
  try {
    const sites = await Site.find()
      .populate('supervisors', 'name email')
      .populate('workers', 'name email');
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sites' });
  }
};

export const getSiteById = async (req: Request, res: Response) => {
  try {
    const site = await Site.findById(req.params.id)
      .populate('supervisors', 'name email')
      .populate('workers', 'name email');
    if (!site) return res.status(404).json({ message: 'Site not found' });
    res.json(site);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching site' });
  }
};
export const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, 
      description, 
      location, 
      geofenceRadius, 
      shiftTimings, 
      safetyThresholds, 
      supervisors, // Array of User IDs
      workers      // Array of User IDs
    } = req.body;

    // 1. Save Site
    const site = new Site({
      name,
      description,
      location,
      geofenceRadius,
      shiftTimings,
      safetyThresholds,
      supervisors,
      workers,
      isActive: true
    });
    
    await site.save();

    const io = req.app.get('io');
    const adminId = req.user?._id;

    // 2. Assign Supervisors
    if (supervisors && supervisors.length > 0) {
      await User.updateMany(
        { _id: { $in: supervisors } },
        { $set: { assignedSite: site._id } }
      );

      // Notifications for Supervisors
      const supervisorNotifs = supervisors.map((id: string) => ({
        recipient: id,
        type: 'site_assignment',
        title: 'New Site Assignment',
        message: `You have been assigned to new site: ${name}. Monitoring is now active.`,
        read: false,
        link: `/supervisor/sites/${site._id}`
      }));
      await Notification.insertMany(supervisorNotifs);

      // Real-time Update
      supervisors.forEach((id: string) => {
        io.to(id.toString()).emit('notification', {
          title: 'New Site Assignment',
          message: `You have been assigned to ${name}`
        });
        io.to(id.toString()).emit('site_assigned', site);
      });
    }

    // 3. Assign Workers
    if (workers && workers.length > 0) {
      await User.updateMany(
        { _id: { $in: workers } },
        { $set: { assignedSite: site._id } }
      );

      // Notifications for Workers
      const workerNotifs = workers.map((id: string) => ({
        recipient: id,
        type: 'site_assignment',
        title: 'Site Assignment Update',
        message: `You have been assigned to ${name}. Shift details are available.`,
        read: false
      }));
      await Notification.insertMany(workerNotifs);
      
       // Real-time Update
       workers.forEach((id: string) => {
        io.to(id.toString()).emit('notification', {
          title: 'Site Assignment Update',
          message: `You have been assigned to ${name}`
        });
        io.to(id.toString()).emit('site_assigned', site);
      });
    }

    // 4. Audit Log
    if (adminId) {
      const log = new AuditLog({
        actor: adminId,
        action: 'CREATE_SITE',
        targetType: 'Site',
        targetId: site._id.toString(),
        details: `Created site ${name} with ${supervisors?.length || 0} supervisors and ${workers?.length || 0} workers`,
        metadata: { siteName: name }
      });
      await log.save();
    }

    // 5. Admin Confirmation (Socket)
    if (adminId) {
       io.to(adminId.toString()).emit('site_created_success', { 
           message: `Site ${name} created and activated successfully.` 
       });
    }

    res.status(201).json(site);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating site', error });
  }
};

export const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const siteId = req.params.id;
    const { supervisors, workers } = req.body;

    // 1. Find existing site to compare
    const oldSite = await Site.findById(siteId);
    if (!oldSite) {
        return res.status(404).json({ message: 'Site not found' });
    }

    // 2. Update Site
    const site = await Site.findByIdAndUpdate(siteId, req.body, { new: true });

    // 3. Handle Supervisors Changes
    if (supervisors) {
        const oldSups = oldSite.supervisors?.map(s => s.toString()) || [];
        const newSups = supervisors.map((s: string) => s.toString());

        const removedSups = oldSups.filter((id: string) => !newSups.includes(id));
        const addedSups = newSups.filter((id: string) => !oldSups.includes(id));

        if (removedSups.length > 0) {
            await User.updateMany(
                { _id: { $in: removedSups } },
                { $unset: { assignedSite: 1 } }
            );
        }
        if (addedSups.length > 0) {
            await User.updateMany(
                { _id: { $in: addedSups } },
                { $set: { assignedSite: siteId } }
            );
        }
    }

    // 4. Handle Workers Changes
    if (workers) {
        const oldWorkers = oldSite.workers?.map(w => w.toString()) || [];
        const newWorkers = workers.map((w: string) => w.toString());

        const removedWorkers = oldWorkers.filter((id: string) => !newWorkers.includes(id));
        const addedWorkers = newWorkers.filter((id: string) => !oldWorkers.includes(id));

        if (removedWorkers.length > 0) {
            await User.updateMany(
                { _id: { $in: removedWorkers } },
                { $unset: { assignedSite: 1 } }
            );
        }
        if (addedWorkers.length > 0) {
            await User.updateMany(
                { _id: { $in: addedWorkers } },
                { $set: { assignedSite: siteId } }
            );
        }
    }

    // Audit (outside transaction)
    if (req.user?._id) {
        await logAction(
            req.user._id,
            'UPDATE_SITE',
            'Site',
            site?._id.toString(),
            `Updated site ${site?.name}`
        );
    }

    res.json(site);
  } catch (error) {
    res.status(500).json({ message: 'Error updating site' });
  }
};

export const deleteSite = async (req: AuthRequest, res: Response) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ message: 'Site not found' });

    await Site.findByIdAndDelete(req.params.id);

    // Audit
    if (req.user?._id) {
        await logAction(
            req.user._id,
            'DELETE_SITE',
            'Site',
            req.params.id,
            `Deleted site ${site.name}`
        );
    }

    res.json({ message: 'Site deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting site' });
  }
};
