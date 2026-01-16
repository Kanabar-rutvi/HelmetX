import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import AuditLog from '../models/AuditLog';
import SensorData from '../models/SensorData';
import User from '../models/User';
import Device from '../models/Device';
import Site from '../models/Site';
import Shift from '../models/Shift';
import ScanLog from '../models/ScanLog';
import Notification from '../models/Notification';
import { Server } from 'socket.io';

const formatDate = (d: Date) => d.toISOString().split('T')[0];

interface AuthRequest extends Request {
  user?: any;
}

// Helper: Haversine Distance in meters
const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const getMyVitals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const data = await SensorData.find({ userId }).sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyDaily = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const today = formatDate(new Date());
    const records = await Attendance.find({ user: userId, date: today }).sort({ checkInTime: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyWeekly = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(formatDate(d));
    }
    const records = await Attendance.find({ user: userId, date: { $in: days } }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const records = await Attendance.find({ user: userId }).sort({ date: -1 }).limit(30);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getOverview = async (req: Request, res: Response) => {
    try {
        const { siteId, date } = req.query;
        const queryDate = date ? (date as string) : formatDate(new Date());
        
        // Find users in this site first
        let userFilter: any = {};
        if (siteId) {
             const users = await User.find({ assignedSite: siteId }).select('_id');
             userFilter.user = { $in: users.map(u => u._id) };
        }

        const query = { date: queryDate, ...userFilter };

        const totalUsers = await User.countDocuments(siteId ? { assignedSite: siteId, role: 'worker' } : { role: 'worker' });
        const totalAttendance = await Attendance.countDocuments(query);
        const present = await Attendance.countDocuments({ ...query, status: 'present' });
        const late = await Attendance.countDocuments({ ...query, status: 'late' });
        const checkedOut = await Attendance.countDocuments({ ...query, status: 'checked_out' });
        
        // Calculate Average Duration for checked out users
        const completedRecords = await Attendance.find({ ...query, status: 'checked_out', duration: { $exists: true } });
        const totalDuration = completedRecords.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const avgDuration = completedRecords.length ? Math.round(totalDuration / completedRecords.length) : 0;

        // Absent = Total Users - (Present + Late + Checked Out)
        // This accounts for both users with no record and users with explicit 'absent' status
        const absent = Math.max(0, totalUsers - (present + late + checkedOut));

        res.json({ date: queryDate, total: totalAttendance, present, late, checkedOut, absent, avgDuration });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const verifyAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?._id;

        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        record.verified = true;
        await record.save();

        await AuditLog.create({
            actor: adminId,
            action: 'VERIFY_ATTENDANCE',
            targetType: 'Attendance',
            targetId: id,
            details: `Attendance verified by ${req.user?.name || 'Admin'}`
        });

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { checkInTime, checkOutTime, status } = req.body;
        const adminId = req.user?._id;

        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        const oldValues = {
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            status: record.status,
            duration: record.duration
        };

        if (checkInTime) record.checkInTime = new Date(checkInTime);
        if (checkOutTime) {
            record.checkOutTime = new Date(checkOutTime);
            record.status = 'checked_out';
        }
        if (status) record.status = status;

        // Recalculate duration if times changed
        if (record.checkInTime && record.checkOutTime) {
            const start = new Date(record.checkInTime).getTime();
            const end = new Date(record.checkOutTime).getTime();
            record.duration = Math.round((end - start) / (1000 * 60));
        }

        record.source = 'MANUAL_OVERRIDE'; // Mark as manually edited
        await record.save();

        await AuditLog.create({
            actor: adminId,
            action: 'UPDATE_ATTENDANCE',
            targetType: 'Attendance',
            targetId: id,
            details: 'Manual correction of attendance record',
            metadata: {
                old: oldValues,
                new: {
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime,
                    status: record.status,
                    duration: record.duration
                }
            }
        });

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?._id;
        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        await Attendance.findByIdAndDelete(id);
        // Remove associated scan logs for the same day to allow re-scan
        try {
            const base = record.checkInTime ? new Date(record.checkInTime) : new Date(record.date);
            const dayStart = new Date(base);
            dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            await ScanLog.deleteMany({
                helmetId: record.deviceId,
                timestamp: { $gte: dayStart, $lt: dayEnd },
                status: { $in: ['valid', 'duplicate'] }
            });
        } catch { /* noop */ }
        await AuditLog.create({
            actor: adminId,
            action: 'DELETE_ATTENDANCE',
            targetType: 'Attendance',
            targetId: id,
            details: 'Attendance record deleted',
            metadata: {
                user: record.user,
                date: record.date,
                deviceId: record.deviceId,
                status: record.status,
                duration: record.duration
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await AuditLog.find()
            .populate('actor', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getScanLogs = async (req: Request, res: Response) => {
    try {
        const { siteId, date, workerId, helmetId } = req.query;
        let query: any = {};

        if (siteId) query.siteId = siteId;
        if (workerId) query.workerId = workerId;
        if (helmetId) query.helmetId = { $regex: helmetId, $options: 'i' };

        if (date) {
            const start = new Date(date as string);
            const end = new Date(date as string);
            end.setDate(end.getDate() + 1);
            query.timestamp = { $gte: start, $lt: end };
        }

        const logs = await ScanLog.find(query)
            .populate('workerId', 'name email')
            .populate('siteId', 'name')
            .sort({ timestamp: -1 })
            .limit(200);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Internal function to process scan (used by MQTT/Socket/API)
export const processScan = async (payload: {
  helmetId: string;
  scanType: 'IN' | 'OUT';
  timestamp: Date;
  lat?: number;
  lng?: number;
}, io?: Server) => {
  const { helmetId, scanType, timestamp, lat, lng } = payload;
  console.log(`Processing Scan: ${helmetId} ${scanType}`);

  // 1. Identify User & Site
  const device = await Device.findOne({ deviceId: helmetId }).populate('assignedUser');
  if (!device || !device.assignedUser) {
    await ScanLog.create({
      helmetId, scanType, timestamp, location: { lat, lng }, status: 'invalid', failReason: 'Device not assigned'
    });
    return { error: 'Device not assigned' };
  }

  const user: any = device.assignedUser;
  const siteId = user.assignedSite;
  let site: any = null;
  if (siteId) {
    site = await Site.findById(siteId);
  }

  // 2. Geo-fence Validation
  if (site && site.location && site.location.coordinates && lat && lng) {
    const [siteLng, siteLat] = site.location.coordinates;
    const distance = getDistanceFromLatLonInM(lat, lng, siteLat, siteLng);
    if (distance > (site.geofenceRadius || 100)) {
       await ScanLog.create({
         helmetId, workerId: user._id, siteId: site._id, scanType, timestamp, location: { lat, lng }, 
         status: 'geo_fail', failReason: `Outside geofence: ${Math.round(distance)}m`
       });
       // We log it but do we block it? Requirement says "validate". 
       // For strictness, we might return error, but for now let's allow with warning log or strict block.
       // Requirement: "validate that Scan-IN occurs inside the site geo-fence" -> implies block.
       if (scanType === 'IN') {
           return { error: 'Outside Geofence' };
       }
    }
  }

  const today = formatDate(new Date(timestamp));
  
  // 3. Attendance Logic
  if (scanType === 'IN') {
    // Check for existing IN
    const existing = await Attendance.findOne({ user: user._id, date: today });
    if (existing) {
       await ScanLog.create({
         helmetId, workerId: user._id, siteId: site?._id, scanType, timestamp, location: { lat, lng }, 
         status: 'duplicate', failReason: 'Already checked in'
       });
       return { message: 'Already checked in', record: existing };
    }

    const newRecord = await Attendance.create({
      user: user._id,
      deviceId: helmetId,
      site: site?._id,
      date: today,
      checkInTime: timestamp,
      checkInLocation: (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined,
      status: 'present',
      source: 'HELMET_SCANNER'
    });

    await ScanLog.create({
        helmetId, workerId: user._id, siteId: site?._id, scanType, timestamp, location: { lat, lng }, status: 'valid'
    });

    if (io) io.emit('attendance-update', { type: 'IN', record: newRecord });
    return { success: true, record: newRecord };

  } else {
    // scanType === 'OUT'
    const record = await Attendance.findOne({ user: user._id, date: today });
    if (!record) {
        await ScanLog.create({
            helmetId, workerId: user._id, siteId: site?._id, scanType, timestamp, location: { lat, lng }, 
            status: 'invalid', failReason: 'No check-in found'
        });
        return { error: 'No check-in found' };
    }

    if (record.checkOutTime) {
        await ScanLog.create({
            helmetId, workerId: user._id, siteId: site?._id, scanType, timestamp, location: { lat, lng }, 
            status: 'duplicate', failReason: 'Already checked out'
        });
        return { message: 'Already checked out', record };
    }

    record.checkOutTime = timestamp;
    if (lat !== undefined && lng !== undefined) {
        record.checkOutLocation = { lat, lng };
    }
    record.status = 'checked_out';
    
    // Calculate Duration
    const start = new Date(record.checkInTime).getTime();
    const end = new Date(timestamp).getTime();
    record.duration = Math.round((end - start) / (1000 * 60)); // minutes

    await record.save();

    await ScanLog.create({
        helmetId, workerId: user._id, siteId: site?._id, scanType, timestamp, location: { lat, lng }, status: 'valid'
    });

    if (io) io.emit('attendance-update', { type: 'OUT', record });
    return { success: true, record };
  }
};

export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { deviceId, scannedData } = req.body;
    
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    // Attempt to find assigned device for logging
    let helmetId = deviceId || 'MANUAL_APP';
    if (!deviceId) {
        const device = await Device.findOne({ assignedUser: userId });
        if (device) helmetId = device.deviceId;
    }

    const today = formatDate(new Date());
    let record = await Attendance.findOne({ user: userId, date: today });
    
    // Log the scan attempt
    await ScanLog.create({
        helmetId,
        workerId: userId,
        scanType: 'IN',
        timestamp: new Date(),
        status: 'valid',
        failReason: scannedData ? `Scanned: ${scannedData}` : 'Manual App Check-in'
    });

    if (!record) {
      record = await Attendance.create({
        user: userId,
        deviceId: helmetId,
        date: today,
        checkInTime: new Date(),
        status: 'present',
        source: scannedData ? 'QR_SCAN' : 'MANUAL'
      });
    }
    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const checkOut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { scannedData } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    // Attempt to find assigned device for logging
    let helmetId = 'MANUAL_APP';
    const device = await Device.findOne({ assignedUser: userId });
    if (device) helmetId = device.deviceId;

    const today = formatDate(new Date());
    const record = await Attendance.findOne({ user: userId, date: today });
    
    // Log the scan attempt
    await ScanLog.create({
        helmetId,
        workerId: userId,
        scanType: 'OUT',
        timestamp: new Date(),
        status: record ? 'valid' : 'invalid',
        failReason: scannedData ? `Scanned: ${scannedData}` : 'Manual App Check-out'
    });

    if (record) {
      record.checkOutTime = new Date();
      // Calc duration
      const start = new Date(record.checkInTime).getTime();
      const end = record.checkOutTime.getTime();
      record.duration = Math.round((end - start) / (1000 * 60));
      record.status = 'checked_out';
      
      await record.save();
      res.json(record);
    } else {
      res.status(404).json({ message: 'No check-in record found for today' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getTodayAll = async (req: Request, res: Response) => {
  try {
    const { siteId } = req.query;
    const today = formatDate(new Date());
    
    let userFilter: any = {};
    if (siteId) {
       const users = await User.find({ assignedSite: siteId }).select('_id');
       userFilter.user = { $in: users.map(u => u._id) };
    }

    const records = await Attendance.find({ date: today, ...userFilter })
      .populate('user', 'name role assignedSite')
      .sort({ checkInTime: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAllLogs = async (req: Request, res: Response) => {
  try {
    const { siteId, date } = req.query;
    let query: any = {};
    if (date) query.date = date;

    if (siteId) {
        const users = await User.find({ assignedSite: siteId }).select('_id');
        query.user = { $in: users.map(u => u._id) };
    }

    const records = await Attendance.find(query)
      .populate('user', 'name role')
      .sort({ date: -1, checkInTime: -1 })
      .limit(100);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAllHistory = async (req: Request, res: Response) => {
  try {
    const { siteId, startDate, endDate } = req.query;
    let query: any = {};

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    if (siteId) {
        const users = await User.find({ assignedSite: siteId }).select('_id');
        query.user = { $in: users.map(u => u._id) };
    }

    const records = await Attendance.find(query)
      .populate('user', 'name role')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const scanQR = async (req: AuthRequest, res: Response) => {
  try {
      const { qrPayload } = req.body;
      const supervisorId = req.user?._id;

      if (!supervisorId) return res.status(401).json({ message: 'Unauthorized' });

      let parsedPayload;
      try {
          parsedPayload = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
      } catch (e) {
          return res.status(400).json({ message: 'Invalid QR Format' });
      }

      const { type, id } = parsedPayload;

      if (type !== 'HELMET') {
          return res.status(400).json({ message: 'Invalid QR Type. Must be HELMET QR.' });
      }

      const helmetId = id;
      const device = await Device.findOne({ deviceId: helmetId }).populate('assignedUser');

      if (!device || !device.assignedUser) {
           return res.status(404).json({ message: 'Helmet not assigned to any worker' });
      }

      const worker: any = device.assignedUser;

      // Determine Action
      let action = 'CHECK_IN';
      let attendanceRecord = null;

      const existingAttendance = await Attendance.findOne({
          user: worker._id,
          date: formatDate(new Date())
      });

      if (existingAttendance && !existingAttendance.checkOutTime) {
          action = 'CHECK_OUT';
          attendanceRecord = existingAttendance;
      } else if (existingAttendance && existingAttendance.checkOutTime) {
           return res.status(400).json({ message: 'Worker already checked out for today' });
      }

      // Determine Shift
      let shiftData = {
          name: 'Standard Shift',
          startTime: '09:00',
          endTime: '17:00'
      };

      if (worker.assignedShift) {
          const shift = await Shift.findById(worker.assignedShift);
          if (shift) {
              shiftData = {
                  name: shift.name,
                  startTime: shift.startTime,
                  endTime: shift.endTime
              };
          }
      } else if (worker.assignedSite) {
           const site = await Site.findById(worker.assignedSite);
           if (site && site.shiftTimings) {
               shiftData = {
                   name: `${site.name} Shift`,
                   startTime: site.shiftTimings.start,
                   endTime: site.shiftTimings.end
               };
           }
      }

      res.json({
          action,
          worker: {
              id: worker._id,
              name: worker.name,
              role: worker.role,
              email: worker.email
          },
          helmetId,
          attendanceId: attendanceRecord?._id,
          shift: shiftData
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
  }
};

export const approveAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { workerId, helmetId, action, attendanceId, jobRole } = req.body;
        const supervisorId = req.user?._id;
        const io = req.app.get('io');

        if (!supervisorId) return res.status(401).json({ message: 'Unauthorized' });

        const timestamp = new Date();
        const worker = await User.findById(workerId);
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        if (action === 'CHECK_IN') {
             // Create Attendance
             const today = formatDate(timestamp);
             const newRecord = await Attendance.create({
                 user: workerId,
                 deviceId: helmetId,
                 site: worker.assignedSite,
                 date: today,
                 checkInTime: timestamp,
                 status: 'present',
                 source: 'SUPERVISOR_SCAN',
                 verified: true,
                 jobRole
             });
             
             await ScanLog.create({
                 helmetId,
                 workerId,
                 siteId: worker.assignedSite,
                 scanType: 'IN',
                 timestamp,
                 status: 'valid',
                 approvedBy: supervisorId,
                 approvedAt: timestamp
             });

             // Notify Worker
             const notification = await Notification.create({
                recipient: workerId,
                type: 'success',
                title: 'Check-In Approved',
                message: `Your check-in has been approved by supervisor at ${timestamp.toLocaleTimeString()}`,
                read: false
             });

             if (io) {
                io.emit('attendance_notification', {
                    workerId,
                    type: 'CHECK_IN',
                    message: `Check-in approved at ${timestamp.toLocaleTimeString()}`,
                    notification
                });
             }

             res.json(newRecord);
        } else {
            // Check Out
            if (!attendanceId) return res.status(400).json({ message: 'Attendance ID required for check-out' });
            
            const record = await Attendance.findById(attendanceId);
            if (!record) return res.status(404).json({ message: 'Attendance record not found' });

            record.checkOutTime = timestamp;
            record.status = 'checked_out';
            record.verified = true;
            record.verifiedBy = supervisorId;
            record.verifiedAt = timestamp;
            
            // Duration
            const start = new Date(record.checkInTime).getTime();
            const end = timestamp.getTime();
            record.duration = Math.round((end - start) / (1000 * 60));

            await record.save();

            await ScanLog.create({
                 helmetId,
                 workerId,
                 siteId: worker.assignedSite,
                 scanType: 'OUT',
                 timestamp,
                 status: 'valid',
                 approvedBy: supervisorId,
                 approvedAt: timestamp
             });

             // Notify Worker
             const notification = await Notification.create({
                recipient: workerId,
                type: 'success',
                title: 'Check-Out Approved',
                message: `Your check-out has been approved by supervisor at ${timestamp.toLocaleTimeString()}. Duration: ${Math.floor((record.duration || 0)/60)}h ${(record.duration || 0)%60}m`,
                read: false
             });

             if (io) {
                io.emit('attendance_notification', {
                    workerId,
                    type: 'CHECK_OUT',
                    message: `Check-out approved. Duration: ${Math.floor((record.duration || 0)/60)}h ${(record.duration || 0)%60}m`,
                    notification
                });
             }

            res.json(record);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
