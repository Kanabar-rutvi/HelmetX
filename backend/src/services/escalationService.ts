import cron from 'node-cron';
import Alert from '../models/Alert';
import Notification from '../models/Notification';
import User from '../models/User';
import { Server } from 'socket.io';

export const setupEscalationService = (io: Server) => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Find unacknowledged critical alerts older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const alertsToEscalate = await Alert.find({
        severity: 'critical',
        status: 'new',
        timestamp: { $lt: fiveMinutesAgo },
        escalated: { $ne: true }
      });

      if (alertsToEscalate.length === 0) return;

      const admins = await User.find({ role: 'admin' });

      for (const alert of alertsToEscalate) {
        // Mark as escalated
        alert.escalated = true;
        alert.escalatedAt = new Date();
        await alert.save();

        // Notify Admins
        const notifs = admins.map(admin => ({
          recipient: admin._id,
          type: 'error',
          title: 'ESCALATED ALERT',
          message: `Critical alert escalated: ${alert.type} (ID: ${alert._id}) - Unacknowledged for 5+ mins`,
          read: false,
          link: '/admin/alerts'
        }));

        await Notification.insertMany(notifs);

        // Real-time Push
        admins.forEach(admin => {
            io.to(admin._id.toString()).emit('new_alert', {
                ...alert.toObject(),
                message: `ESCALATED: ${alert.type}`
            });
        });
        
        console.log(`Escalated alert ${alert._id} to admins`);
      }
    } catch (error) {
      console.error('Escalation Service Error:', error);
    }
  });

  console.log('Escalation Service initialized');
};
