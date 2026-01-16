import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Plus, Trash2, Edit } from 'lucide-react';
import Modal from '../components/Modal';

const AdminUsers = () => {
  type UserItem = { _id: string; name: string; email: string; role: 'worker' | 'supervisor' | 'admin'; phone?: string; employeeId?: string };
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ name: string; email: string; password?: string; role: 'worker' | 'supervisor' | 'admin'; employeeId?: string; phone?: string }>({ name: '', email: '', password: '', role: 'worker', employeeId: '', phone: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const usersData = await api.get<UserItem[]>('/users');
      setUsers((usersData.data || []) as UserItem[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { fetchUsers(); }, 0);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const openAddUser = () => {
    setEditingId(null);
    setUserData({ name: '', email: '', password: '', role: 'worker', employeeId: '', phone: '' });
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: UserItem) => {
    setEditingId(user._id);
    setUserData({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.role, 
      employeeId: user.employeeId || '', 
      phone: user.phone || '' 
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload: { name: string; email: string; role: 'worker' | 'supervisor' | 'admin'; employeeId?: string; phone?: string; password?: string } = { ...userData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingId}`, payload);
      } else {
        await api.post('/users', userData);
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (error) {
      const msg = (typeof error === 'object' && error && 'response' in error && (error as { response?: { data?: { message?: string } } }).response?.data?.message) 
        || (error instanceof Error ? error.message : 'Error saving user');
      alert(msg);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert('Error deleting user');
    }
  };

  return (
    <Layout role="admin">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button onClick={openAddUser} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role}</td>
                <td className="p-3">{user.phone || '-'}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEditUser(user)} className="text-blue-600"><Edit size={18} /></button>
                  <button onClick={() => deleteUser(user._id)} className="text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingId ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <input type="text" placeholder="Name" className="w-full p-2 border rounded" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} required />
          <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} required />
          <input type="password" placeholder="Password (leave blank to keep)" className="w-full p-2 border rounded" value={userData.password} onChange={e => setUserData({...userData, password: e.target.value})} />
          <select className="w-full p-2 border rounded" value={userData.role} onChange={e => setUserData({...userData, role: e.target.value as 'worker' | 'supervisor' | 'admin'})}>
            <option value="worker">Worker</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
          <input type="text" placeholder="Employee ID" className="w-full p-2 border rounded" value={userData.employeeId} onChange={e => setUserData({...userData, employeeId: e.target.value})} />
          <input type="text" placeholder="Phone" className="w-full p-2 border rounded" value={userData.phone} onChange={e => setUserData({...userData, phone: e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Save</button>
        </form>
      </Modal>
    </Layout>
  );
};

export default AdminUsers;
