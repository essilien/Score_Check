'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  // 数据状态
  const [scores, setScores] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // 正在编辑的临时状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchScores();
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchScores();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchScores = async () => {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('student_id', { ascending: true });
    if (error) console.error(error);
    else setScores(data || []);
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditBuffer({ ...item });
  };

  // --- 核心逻辑：处理分数变动（支持0.5步长） ---
  const handleBreakdownChange = (key: string, value: string) => {
    if (!editBuffer) return;

    // 强制转换为以0.5为单位的数值
    const val = parseFloat(value) || 0;
    const newBreakdown = { ...editBuffer.breakdown, [key]: val.toString() };

    // 自动求和并处理浮点数精度
    const rawTotal = Object.values(newBreakdown).reduce(
      (sum: number, v: any) => {
        return sum + (parseFloat(v) || 0);
      },
      0
    );

    // 确保总分也是 0.5 的倍数（虽然小项相加自然会是0.5倍数，但toFixed保证显示美观）
    const newTotal = Math.round(rawTotal * 2) / 2;

    setEditBuffer({
      ...editBuffer,
      breakdown: newBreakdown,
      total_score: newTotal,
    });
  };

  const handleSave = async () => {
    if (!editBuffer) return;

    const { error } = await supabase
      .from('scores')
      .update({
        total_score: editBuffer.total_score,
        breakdown: editBuffer.breakdown,
      })
      .eq('id', editBuffer.id);

    if (error) {
      alert('保存失败: ' + error.message);
    } else {
      setEditingId(null);
      setEditBuffer(null);
      fetchScores();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该学生成绩？')) return;
    await supabase.from('scores').delete().eq('id', id);
    fetchScores();
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event: any) => {
      try {
        const text = event.target.result;
        const lines = text
          .split('\n')
          .map((l: any) => l.trim())
          .filter(Boolean);
        const headers = lines[0].split(',');
        const dynamicKeys = headers.slice(3);

        const uploadData = lines.slice(1).map((line: string) => {
          const values = line.split(',');
          const breakdown: any = {};
          dynamicKeys.forEach((key, i) => {
            // 上传时也确保处理为 0.5 单位
            const v = parseFloat(values[i + 3]) || 0;
            breakdown[key] = (Math.round(v * 2) / 2).toString();
          });
          return {
            student_id: values[0],
            student_name: values[1],
            total_score: Math.round((parseFloat(values[2]) || 0) * 2) / 2,
            breakdown: breakdown,
          };
        });
        await supabase.from('scores').upsert(uploadData);
        fetchScores();
      } catch (err: any) {
        alert('上传失败，请检查CSV格式');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file);
  };

  if (loading)
    return (
      <div className="p-20 text-center text-gray-500 font-medium">
        安全验证中...
      </div>
    );

  if (!session)
    return (
      <div className="flex flex-col items-center p-20 gap-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-800">教师登录后台</h1>
        <input
          type="email"
          placeholder="教师邮箱"
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 w-full rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="密码"
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 w-full rounded-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => supabase.auth.signInWithPassword({ email, password })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 w-full rounded-lg shadow-md transition"
        >
          立即进入
        </button>
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            成绩管理中心
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
            {session.user.email}
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-red-400 hover:text-red-600 text-sm font-bold border border-red-100 px-4 py-2 rounded-full transition hover:bg-red-50"
        >
          退出系统
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-gray-100">
        <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 批量导入
          (CSV)
        </h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={uploading}
          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-[11px] uppercase tracking-wider">
              <th className="p-5 border-b font-bold">学号</th>
              <th className="p-5 border-b font-bold">姓名</th>
              <th className="p-5 border-b font-bold">总分 (步长: 0.5)</th>
              <th className="p-5 border-b font-bold">详细得分项</th>
              <th className="p-5 border-b font-bold">管理操作</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {scores.map((item) => {
              const isEditing = editingId === item.id;
              const displayItem = isEditing ? editBuffer : item;

              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 transition-colors ${
                    isEditing ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="p-5 font-mono text-sm text-gray-400">
                    {displayItem.student_id}
                  </td>
                  <td className="p-5 font-bold text-gray-800">
                    {displayItem.student_name}
                  </td>
                  <td className="p-5">
                    <span
                      className={`text-xl font-black ${
                        isEditing ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {displayItem.total_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-3">
                      {displayItem.breakdown &&
                        Object.entries(displayItem.breakdown).map(
                          ([key, val]: any) => (
                            <div
                              key={key}
                              className={`flex items-center rounded-lg px-3 py-1.5 border transition-all ${
                                isEditing
                                  ? 'bg-white border-blue-200 shadow-sm'
                                  : 'bg-gray-50 border-gray-100'
                              }`}
                            >
                              <span className="text-[10px] text-gray-400 mr-3 font-black uppercase tracking-tighter">
                                {key}
                              </span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={val}
                                  onChange={(e) =>
                                    handleBreakdownChange(key, e.target.value)
                                  }
                                  className="w-14 outline-none text-blue-600 font-black text-sm bg-transparent"
                                />
                              ) : (
                                <span className="text-sm font-bold text-gray-600">
                                  {parseFloat(val).toFixed(1)}
                                </span>
                              )}
                            </div>
                          )
                        )}
                    </div>
                  </td>
                  <td className="p-5">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditBuffer(null);
                          }}
                          className="bg-gray-100 text-gray-500 px-5 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <button
                          onClick={() => startEditing(item)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-black uppercase tracking-widest border-b-2 border-transparent hover:border-blue-500 pb-1 transition-all"
                        >
                          修改成绩
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {scores.length === 0 && (
          <div className="p-20 text-center">
            <div className="text-gray-200 text-6xl mb-4">Empty</div>
            <p className="text-gray-400 font-medium">
              暂无学生数据，请先通过上方上传 CSV 文件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
