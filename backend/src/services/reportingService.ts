import cron from 'node-cron';
import Site from '../models/Site';
import Attendance from '../models/Attendance';
import Alert from '../models/Alert';
import SensorData from '../models/SensorData';
import SiteSafetyReport from '../models/SiteSafetyReport';
import User from '../models/User';

export const setupReportingService = () => {
  // Run every day at 23:59
  cron.schedule('59 23 * * *', async () => {
    console.log('Generating Daily Site Safety Reports...');
    try {
      const sites = await Site.find();
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today + 'T00:00:00.000Z');
      const endOfDay = new Date(today + 'T23:59:59.999Z');

      for (const site of sites) {
        // 1. Workers Stats
        // Find users assigned to this site
        const workers = await User.find({ role: 'worker' });
        const totalWorkers = workers.length;
        
        // Attendance
        const attendanceCount = await Attendance.countDocuments({
            user: { $in: workers.map(w => w._id) },
            date: today,
            status: { $in: ['present', 'late'] }
        });
        const presentWorkers = attendanceCount;
        const absentWorkers = totalWorkers - presentWorkers;

        // 2. Alerts Stats
        const alerts = await Alert.find({
            timestamp: { $gte: startOfDay, $lte: endOfDay },
            // We need to link alerts to site. Alerts have 'user' or 'deviceId'.
            // Best is to find alerts for users assigned to this site.
            user: { $in: workers.map(w => w._id) } 
        });

        const totalAlerts = alerts.length;
        const alertsBySeverity = {
            critical: alerts.filter(a => a.severity === 'critical').length,
            high: alerts.filter(a => a.severity === 'high').length,
            medium: alerts.filter(a => a.severity === 'medium').length,
            low: alerts.filter(a => a.severity === 'low').length
        };

        const alertsByType: Record<string, number> = {};
        alerts.forEach(a => {
            alertsByType[a.type] = (alertsByType[a.type] || 0) + 1;
        });

        // 3. Helmet Compliance
        // Check sensor data for helmetOn=true vs total samples
        // This is heavy, so maybe just sample or check alerts 'helmet_off'
        // Let's use helmet_off alerts vs present workers duration (approx)
        // Or just simpler: 100 - (helmet_off_alerts * penalty)
        // Better: Avg helmetOn from sensor data for these users
        // Limit sensor data query to avoid OOM
        // const sensorData = await SensorData.find({
        //    userId: { $in: workers.map(w => w._id) },
        //    timestamp: { $gte: startOfDay, $lte: endOfDay }
        // }).select('helmetOn');
        // This could be millions of records.
        // Alternative: Use alerts 'helmet_off'.
        // If 0 helmet_off alerts => 100% compliance.
        // If 10 alerts => less.
        // Let's stick to a simple heuristic for now: 100 - (helmet_off_count * 5), min 0.
        
        const helmetOffCount = alertsByType['helmet_off'] || 0;
        const avgHelmetCompliance = Math.max(0, 100 - (helmetOffCount * 5));

        // 4. Status Determination
        let status: 'safe' | 'attention' | 'critical' = 'safe';
        if (alertsBySeverity.critical > 0 || alertsBySeverity.high > 2) {
            status = 'critical';
        } else if (alertsBySeverity.medium > 5 || helmetOffCount > 5) {
            status = 'attention';
        }

        // Save Report
        await SiteSafetyReport.findOneAndUpdate(
            { site: site._id, date: today },
            {
                metrics: {
                    totalWorkers,
                    presentWorkers,
                    absentWorkers,
                    totalAlerts,
                    alertsBySeverity,
                    alertsByType,
                    avgHelmetCompliance
                },
                status,
                generatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        
        console.log(`Report generated for site: ${site.name}`);
      }
    } catch (error) {
      console.error('Error generating daily reports:', error);
    }
  });
  
  console.log('Reporting Service initialized');
};
