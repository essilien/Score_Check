'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // 使用统一的 client
import { useRouter } from 'next/navigation'; // 引入路由跳转

export default function ScoreApp() {
  const router = useRouter();
  const [sid, setSid] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!sid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('student_id', sid)
      .single();

    if (error) {
      alert('未找到该学号的成绩，请检查输入是否正确');
      setResult(null);
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden mt-10">
        {/* 顶部导航 */}
        <div className="flex border-b text-center">
          <button className="flex-1 py-3 bg-blue-50 text-blue-600 font-bold">
            学生查询
          </button>
          <button
            onClick={() => router.push('/admin')} // 关键改动：点击直接跳往管理后台
            className="flex-1 py-3 text-gray-400 hover:text-blue-600 transition"
          >
            教师入口
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <input
              placeholder="请输入你的学号"
              className="w-full border p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 text-black"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            />
            <button
              onClick={handleQuery}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? '查询中...' : '查询成绩'}
            </button>

            {/* 查询结果展示区 (保持你原有的 result 渲染逻辑不变) */}
            {result && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-4 border-b border-blue-100 pb-2">
                  <span className="text-lg font-bold text-gray-800">
                    {result.student_name}
                  </span>
                  <span className="text-2xl font-black text-blue-700">
                    {result.total_score}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.breakdown || {}).map(
                    ([key, val]: any) => (
                      <div
                        key={key}
                        className="bg-white p-2 rounded shadow-sm border border-blue-100"
                      >
                        <p className="text-[10px] text-gray-400 uppercase">
                          {key}
                        </p>
                        <p className="font-semibold text-gray-700">{val}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-gray-300 text-xs mt-8">
        © 2026 成绩查询系统
      </p>
    </div>
  );
}
