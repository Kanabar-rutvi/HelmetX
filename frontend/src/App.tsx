import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import WorkerDashboard from './pages/WorkerDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AttendanceVerification from './pages/AttendanceVerification';
import DPRApproval from './pages/DPRApproval';
import MaterialsApproval from './pages/MaterialsApproval';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDevices from './pages/AdminDevices';
import AdminSites from './pages/AdminSites';
import AdminAttendance from './pages/AdminAttendance';
import AdminAlerts from './pages/AdminAlerts';
import AdminReports from './pages/AdminReports';
import AdminAudit from './pages/AdminAudit';
import AdminSettings from './pages/AdminSettings';
import RequestMaterials from './pages/RequestMaterials';
import SubmitDPR from './pages/SubmitDPR';
import Attendance from './pages/Attendance';
import MyTasks from './pages/MyTasks';
import SafetyMonitor from './pages/SafetyMonitor';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const PrivateRoute = ({ children, roles }: { children: ReactNode, roles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
          
          <Route path="/worker" element={
            <PrivateRoute roles={['worker']}>
              <WorkerDashboard />
            </PrivateRoute>
          } />
          <Route path="/worker/materials" element={
            <PrivateRoute roles={['worker']}>
              <RequestMaterials />
            </PrivateRoute>
          } />
          <Route path="/worker/dpr" element={
            <PrivateRoute roles={['worker']}>
              <SubmitDPR />
            </PrivateRoute>
          } />
          <Route path="/worker/attendance" element={
            <PrivateRoute roles={['worker']}>
              <Attendance />
            </PrivateRoute>
          } />
          <Route path="/worker/tasks" element={
            <PrivateRoute roles={['worker']}>
              <MyTasks />
            </PrivateRoute>
          } />
          
          <Route path="/supervisor" element={
            <PrivateRoute roles={['supervisor']}>
              <SupervisorDashboard />
            </PrivateRoute>
          } />
          <Route path="/supervisor/attendance" element={
            <PrivateRoute roles={['supervisor']}>
              <AttendanceVerification />
            </PrivateRoute>
          } />
          <Route path="/supervisor/dpr-approval" element={
            <PrivateRoute roles={['supervisor']}>
              <DPRApproval />
            </PrivateRoute>
          } />
          <Route path="/supervisor/materials-approval" element={
            <PrivateRoute roles={['supervisor']}>
              <MaterialsApproval />
            </PrivateRoute>
          } />
          <Route path="/supervisor/safety" element={
            <PrivateRoute roles={['supervisor']}>
              <SafetyMonitor />
            </PrivateRoute>
          } />
          
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute roles={['admin']}>
              <AdminUsers />
            </PrivateRoute>
          } />
          <Route path="/admin/devices" element={
            <PrivateRoute roles={['admin']}>
              <AdminDevices />
            </PrivateRoute>
          } />
          <Route path="/admin/sites" element={
            <PrivateRoute roles={['admin']}>
              <AdminSites />
            </PrivateRoute>
          } />
          <Route path="/admin/attendance" element={
            <PrivateRoute roles={['admin']}>
              <AdminAttendance />
            </PrivateRoute>
          } />
          <Route path="/admin/alerts" element={
            <PrivateRoute roles={['admin']}>
              <AdminAlerts />
            </PrivateRoute>
          } />
          <Route path="/admin/reports" element={
            <PrivateRoute roles={['admin']}>
              <AdminReports />
            </PrivateRoute>
          } />
          <Route path="/admin/audit" element={
            <PrivateRoute roles={['admin']}>
              <AdminAudit />
            </PrivateRoute>
          } />
          <Route path="/admin/settings" element={
            <PrivateRoute roles={['admin']}>
              <AdminSettings />
            </PrivateRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
