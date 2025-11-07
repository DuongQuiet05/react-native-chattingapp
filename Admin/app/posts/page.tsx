'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Post {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  privacyType: string;
  mediaUrls: string[];
  location: string | null;
  commentCount: number;
  reactionCount: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, [page, search]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/posts', {
        params: {
          page,
          size: 20,
          search: search || undefined,
        },
      });
      setPosts(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (postId: number) => {
    try {
      const response = await apiClient.get(`/api/admin/posts/${postId}`);
      setSelectedPost(response.data);
    } catch (error) {
      console.error('Failed to load post details:', error);
      alert('Không thể tải chi tiết bài viết');
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    
    try {
      await apiClient.delete(`/api/admin/posts/${postId}`);
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      loadPosts();
      alert('Xóa thành công');
    } catch (error) {
      alert('Xóa thất bại');
    }
  };

  const handleHide = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn ẩn bài viết này?')) return;
    
    try {
      await apiClient.post(`/api/admin/posts/${postId}/hide`);
      loadPosts();
      if (selectedPost?.id === postId) {
        const response = await apiClient.get(`/api/admin/posts/${postId}`);
        setSelectedPost(response.data);
      }
      alert('Ẩn bài viết thành công');
    } catch (error) {
      alert('Ẩn bài viết thất bại');
    }
  };

  const handleUnhide = async (postId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hiển thị lại bài viết này?')) return;
    
    try {
      await apiClient.post(`/api/admin/posts/${postId}/unhide`);
      loadPosts();
      if (selectedPost?.id === postId) {
        const response = await apiClient.get(`/api/admin/posts/${postId}`);
        setSelectedPost(response.data);
      }
      alert('Hiển thị bài viết thành công');
    } catch (error) {
      alert('Hiển thị bài viết thất bại');
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Bài viết</h1>
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
        {selectedPost && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Chi tiết bài viết</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPost.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tác giả</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPost.authorName} (ID: {selectedPost.authorId})</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedPost.content || '(Không có nội dung)'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quyền riêng tư</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPost.privacyType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vị trí</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPost.location || '(Không có)'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng bình luận</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPost.commentCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng reaction</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPost.reactionCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <p className="mt-1 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedPost.isHidden 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedPost.isHidden ? 'Đã ẩn' : 'Hiển thị'}
                  </span>
                </p>
              </div>
              {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Media ({selectedPost.mediaUrls.length} file)</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {selectedPost.mediaUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedPost.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày cập nhật</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedPost.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="flex space-x-4 pt-4 border-t">
                {selectedPost.isHidden ? (
                  <button
                    onClick={() => handleUnhide(selectedPost.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Hiển thị lại
                  </button>
                ) : (
                  <button
                    onClick={() => handleHide(selectedPost.id)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Ẩn bài viết
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedPost.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Xóa bài viết
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
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
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className={`border rounded-lg p-4 ${post.isHidden ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">{post.authorName}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleString('vi-VN')}
                            </span>
                            {post.isHidden && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Đã ẩn
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2 line-clamp-3">{post.content || '(Không có nội dung)'}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>💬 {post.commentCount}</span>
                            <span>👍 {post.reactionCount}</span>
                            <span>🔒 {post.privacyType}</span>
                          </div>
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="mt-2 text-sm text-gray-500">
                              {post.mediaUrls.length} ảnh/video
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => handleViewDetails(post.id)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50"
                          >
                            Xem chi tiết
                          </button>
                          {post.isHidden ? (
                            <button
                              onClick={() => handleUnhide(post.id)}
                              className="px-3 py-1 text-sm text-green-600 hover:text-green-900 border border-green-300 rounded hover:bg-green-50"
                            >
                              Hiển thị
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHide(post.id)}
                              className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-900 border border-yellow-300 rounded hover:bg-yellow-50"
                            >
                              Ẩn
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
