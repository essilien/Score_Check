'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TeacherModule() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  // 1. 初始化并监听登录状态
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 登录逻辑
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert('登录失败: ' + error.message);
    setLoading(false);
  };

  // 3. 登出逻辑
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('已退出登录');
  };

  // --- UI 判断逻辑 ---

  // 情况 A: 老师已登录，显示录入表单
  if (session) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">成绩录入系统</h2>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:underline"
          >
            退出登录
          </button>
        </div>

        {/* 这里是你之前的录入表单代码 */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              学生学号
            </label>
            <input
              type="text"
              className="w-full border p-2 rounded mt-1"
              placeholder="例如: 2024001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              分数
            </label>
            <input type="number" className="w-full border p-2 rounded mt-1" />
          </div>
          <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
            提交成绩
          </button>
        </form>
      </div>
    );
  }

  // 情况 B: 未登录，显示登录界面
  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-600">教师管理后台</h2>
        <p className="text-gray-500 text-sm mt-2">请登录以开启成绩录入权限</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            邮箱地址
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="teacher@school.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            登录密码
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transform active:scale-95 transition disabled:bg-gray-400"
        >
          {loading ? '验证中...' : '立即登录'}
        </button>
      </form>
    </div>
  );
}
