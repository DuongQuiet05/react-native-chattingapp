'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface PostAnalysisResponse {
  analysisType: string;
  summary: string;
  insights: Record<string, any>;
  keyFindings: string[];
  recommendations?: string[];
  totalPostsAnalyzed: number;
  analyzedAt: string;
  rawAnalysis?: string;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PostAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxPosts, setMaxPosts] = useState(150);
  const [analysisType, setAnalysisType] = useState('general');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await apiClient.post('/api/admin/posts/analyze', {
        maxPosts,
        analysisType,
      });
      setAnalysis(response.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      const errorMessage = err.response?.data?.summary || 
                          err.response?.data?.message || 
                          err.message || 
                          'Lỗi khi phân tích bài đăng';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Trang chủ
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Phân tích Bài đăng</h1>
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
        {/* Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt phân tích</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng bài đăng tối đa
              </label>
              <input
                type="number"
                min="100"
                max="200"
                value={maxPosts}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 150;
                  // Clamp between 100-200
                  const clampedValue = Math.max(100, Math.min(200, value));
                  setMaxPosts(clampedValue);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Phạm vi: 100-200 bài đăng gần đây nhất (mặc định: 150)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại phân tích
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Tổng hợp</option>
                <option value="sentiment">Phân tích cảm xúc</option>
                <option value="topics">Chủ đề phổ biến</option>
                <option value="summary">Tóm tắt</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang phân tích...' : 'Bắt đầu phân tích'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">📊 Kết quả phân tích</h2>
                  <p className="text-blue-100">
                    Đã phân tích <span className="font-bold">{analysis.totalPostsAnalyzed}</span> bài đăng gần đây
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-100">Loại phân tích</div>
                  <div className="text-lg font-semibold capitalize">{analysis.analysisType}</div>
                  <div className="text-xs text-blue-100 mt-1">
                    {new Date(analysis.analyzedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📝</span> Tóm tắt
              </h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* Key Findings */}
            {analysis.keyFindings && analysis.keyFindings.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔍</span> Những phát hiện chính
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.keyFindings.map((finding, index) => (
                    <div 
                      key={index} 
                      className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start">
                        <span className="text-green-600 font-bold mr-2 text-lg">#{index + 1}</span>
                        <span className="text-gray-800 flex-1">{finding}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-yellow-500">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💡</span> Khuyến nghị
                </h2>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <span className="text-yellow-600 mr-3 mt-1">✓</span>
                      <span className="text-gray-800 flex-1">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insights */}
            {analysis.insights && Object.keys(analysis.insights).length > 0 && (
              <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-purple-500">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📈</span> Insights chi tiết
                </h2>
                <div className="space-y-6">
                  {/* Sentiment */}
                  {analysis.insights.sentiment && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Cảm xúc người dùng</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {analysis.insights.sentiment.positive !== undefined && (
                          <div className="text-center bg-green-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-700">
                              {analysis.insights.sentiment.positive}%
                            </div>
                            <div className="text-sm text-green-600 mt-1">Tích cực</div>
                          </div>
                        )}
                        {analysis.insights.sentiment.negative !== undefined && (
                          <div className="text-center bg-red-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-red-700">
                              {analysis.insights.sentiment.negative}%
                            </div>
                            <div className="text-sm text-red-600 mt-1">Tiêu cực</div>
                          </div>
                        )}
                        {analysis.insights.sentiment.neutral !== undefined && (
                          <div className="text-center bg-gray-100 rounded-lg p-3">
                            <div className="text-2xl font-bold text-gray-700">
                              {analysis.insights.sentiment.neutral}%
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Trung tính</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top Topics */}
                  {analysis.insights.topTopics && Array.isArray(analysis.insights.topTopics) && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Chủ đề phổ biến</h3>
                      <div className="space-y-2">
                        {analysis.insights.topTopics.slice(0, 5).map((topic: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-800">
                                {topic.name || topic}
                              </span>
                              {topic.count && (
                                <span className="text-purple-600 font-semibold">
                                  {topic.count} bài
                                </span>
                              )}
                            </div>
                            {topic.description && (
                              <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Engagement */}
                  {analysis.insights.engagement && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Mức độ tương tác</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {analysis.insights.engagement.averageReactions !== undefined && (
                          <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xl font-bold text-purple-700">
                              {typeof analysis.insights.engagement.averageReactions === 'number' 
                                ? analysis.insights.engagement.averageReactions.toFixed(1)
                                : analysis.insights.engagement.averageReactions}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">TB lượt thích</div>
                          </div>
                        )}
                        {analysis.insights.engagement.averageComments !== undefined && (
                          <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xl font-bold text-purple-700">
                              {typeof analysis.insights.engagement.averageComments === 'number'
                                ? analysis.insights.engagement.averageComments.toFixed(1)
                                : analysis.insights.engagement.averageComments}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">TB bình luận</div>
                          </div>
                        )}
                        {analysis.insights.engagement.engagementRate && (
                          <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xl font-bold text-purple-700">
                              {analysis.insights.engagement.engagementRate}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Tỷ lệ tương tác</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Other insights */}
                  {Object.entries(analysis.insights)
                    .filter(([key]) => !['sentiment', 'topTopics', 'engagement'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <div className="bg-white rounded p-3">
                          {typeof value === 'object' ? (
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-gray-700">{String(value)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Raw Analysis (Collapsible) */}
            {analysis.rawAnalysis && (
              <details className="bg-white shadow rounded-lg p-6">
                <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-4">
                  Xem phân tích chi tiết (Raw)
                </summary>
                <div className="mt-4 bg-gray-50 rounded p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                    {analysis.rawAnalysis}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysis && !error && !isLoading && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              Chọn cài đặt và nhấn "Bắt đầu phân tích" để xem kết quả phân tích bài đăng
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

