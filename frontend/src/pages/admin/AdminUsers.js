import { useState, useEffect } from 'react';
import api from '../../services/api';

const roleColors = { customer: 'bg-blue-100 text-blue-700', merchant: 'bg-orange-100 text-orange-700', courier: 'bg-indigo-100 text-indigo-700', admin: 'bg-red-100 text-red-700' };
const roleLabels = { customer: 'Müşteri', merchant: 'Esnaf', courier: 'Kurye', admin: 'Admin' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleUser = async (id) => {
    const res = await api.patch(`/admin/users/${id}/toggle`);
    setUsers(prev => prev.map(u => u.id === id ? {...u, is_active: res.data.is_active} : u));
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'customer', 'merchant', 'courier', 'admin'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === r ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {r === 'all' ? 'Tümü' : roleLabels[r]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Ad</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-left px-4 py-3">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${roleColors[u.role]}`}>{roleLabels[u.role]}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleUser(u.id)}
                    className={`text-xs px-3 py-1 rounded-lg transition ${u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {u.is_active ? 'Devre Dışı' : 'Aktif Et'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
