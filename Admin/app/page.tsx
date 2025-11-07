'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard title="Tổng số người dùng" endpoint="/api/admin/stats" field="totalUsers" />
          <DashboardCard title="Tổng số bài viết" endpoint="/api/admin/stats" field="totalPosts" />
          <DashboardCard title="Tổng số đoạn chat" endpoint="/api/admin/stats" field="totalConversations" />
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quản lý</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/users')}
                className="px-6 py-3 text-left bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-blue-900">Quản lý Người dùng</h3>
                <p className="text-sm text-blue-700 mt-1">Xem và quản lý tất cả người dùng</p>
              </button>
              <button
                onClick={() => router.push('/posts')}
                className="px-6 py-3 text-left bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-green-900">Quản lý Bài viết</h3>
                <p className="text-sm text-green-700 mt-1">Xem và quản lý tất cả bài viết</p>
              </button>
              <button
                onClick={() => router.push('/analysis')}
                className="px-6 py-3 text-left bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-purple-900">Phân tích Bài đăng</h3>
                <p className="text-sm text-purple-700 mt-1">Phân tích bài đăng bằng AI</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, endpoint, field }: { title: string; endpoint: string; field: string }) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    apiClient.get(endpoint)
      .then((res) => setValue(res.data[field]))
      .catch(() => setValue(null));
  }, [endpoint, field]);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">#</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">
                {value !== null ? value.toLocaleString('vi-VN') : '...'}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

