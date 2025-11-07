'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  role: string;
  isBlocked: boolean;
  lastSeen: string | null;
}

interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  status: string;
  lastSeen: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UserProfile | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);

  useEffect(() => {
    loadCurrentAdmin();
    loadUsers();
  }, [page, search]);

  const loadCurrentAdmin = async () => {
    try {
      const response = await apiClient.get('/api/users/me');
      setCurrentAdminId(response.data.id);
    } catch (error) {
      console.error('Failed to load current admin:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/users', {
        params: {
          page,
          size: 20,
          search: search || undefined,
        },
      });
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: number) => {
    // Prevent admin from blocking themselves
    if (currentAdminId !== null && userId === currentAdminId) {
      alert('Bạn không thể chặn chính mình');
      return;
    }
    
    if (!confirm('Bạn có chắc chắn muốn chặn người dùng này?')) return;
    
    try {
      // Hardcode API URL to ensure it's absolute
      const apiBaseUrl = 'http://localhost:8080';
      const apiUrl = `${apiBaseUrl}/api/admin/users/${userId}/block`;
      const token = localStorage.getItem('admin_token');
      
      console.log('=== BLOCK USER DEBUG ===');
      console.log('User ID:', userId);
      console.log('API Base URL:', apiBaseUrl);
      console.log('Full API URL:', apiUrl);
      console.log('Token exists:', !!token);
      console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
      
      // Use fetch directly with absolute URL
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({}),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        alert('Chặn người dùng thành công');
        loadUsers();
      } else {
        alert('Chặn thất bại: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (error: any) {
      console.error('=== BLOCK ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      alert('Chặn thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleUnblock = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn bỏ chặn người dùng này?')) return;
    
    try {
      // Hardcode API URL to ensure it's absolute
      const apiBaseUrl = 'http://localhost:8080';
      const apiUrl = `${apiBaseUrl}/api/admin/users/${userId}/unblock`;
      const token = localStorage.getItem('admin_token');
      
      console.log('=== UNBLOCK USER DEBUG ===');
      console.log('User ID:', userId);
      console.log('Full API URL:', apiUrl);
      
      // Use fetch directly with absolute URL
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({}),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        alert('Bỏ chặn người dùng thành công');
        loadUsers();
      } else {
        alert('Bỏ chặn thất bại: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (error: any) {
      console.error('=== UNBLOCK ERROR ===');
      console.error('Error:', error);
      alert('Bỏ chặn thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  const handleEdit = async (userId: number) => {
    try {
      const response = await apiClient.get(`/api/admin/users/${userId}`);
      const profileResponse = await apiClient.get(`/api/users/${userId}/profile`);
      setEditForm(profileResponse.data);
      setEditingUser(userId);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      alert('Không thể tải thông tin người dùng');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !editForm) return;
    
    try {
      await apiClient.put(`/api/admin/users/${editingUser}/profile`, {
        displayName: editForm.displayName,
        avatarUrl: editForm.avatarUrl,
        bio: editForm.bio,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
      });
      setEditingUser(null);
      setEditForm(null);
      loadUsers();
      alert('Cập nhật thành công');
    } catch (error) {
      alert('Cập nhật thất bại');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Quay lại
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                router.push('/login');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {editingUser && editForm ? (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa thông tin người dùng</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên hiển thị</label>
                <input
                  type="text"
                  value={editForm.displayName || ''}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                <input
                  type="text"
                  value={editForm.avatarUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                <input
                  type="text"
                  value={editForm.dateOfBirth || ''}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                <select
                  value={editForm.gender || ''}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Lưu
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên đăng nhập
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tên hiển thị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái chặn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.displayName || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isBlocked 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.isBlocked ? 'Đã chặn' : 'Bình thường'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              Chỉnh sửa
                            </button>
                            {user.isBlocked ? (
                              <button
                                onClick={() => handleUnblock(user.id)}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                Bỏ chặn
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(user.id)}
                                disabled={currentAdminId !== null && user.id === currentAdminId}
                                className={`px-2 py-1 text-xs rounded ${
                                  currentAdminId !== null && user.id === currentAdminId
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                }`}
                                title={currentAdminId !== null && user.id === currentAdminId ? 'Bạn không thể chặn chính mình' : ''}
                              >
                                Chặn
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-700">
                    Trang {page + 1} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
