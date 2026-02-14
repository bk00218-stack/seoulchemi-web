'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/app/components/Navigation';

interface SmsTemplate {
  id: number;
  name: string;
  code: string;
  category: string;
  content: string;
  isActive: boolean;
  isAuto: boolean;
}

interface SmsHistory {
  id: number;
  phone: string;
  storeName: string | null;
  templateName: string | null;
  message: string;
  orderNo: string | null;
  status: string;
  sendType: string;
  sentAt: string | null;
  sentBy: string | null;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  order: '주문',
  shipping: '배송',
  payment: '결제',
  general: '일반',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-gray-100 text-gray-800' },
  sent: { label: '발송완료', color: 'bg-green-100 text-green-800' },
  failed: { label: '실패', color: 'bg-red-100 text-red-800' },
};

export default function SmsManagementPage() {
  const [tab, setTab] = useState<'templates' | 'history'>('templates');
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [histories, setHistories] = useState<SmsHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<SmsTemplate> | null>(null);

  // 템플릿 폼
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'general',
    content: '',
    isActive: true,
    isAuto: false,
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/sms/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
    }
  };

  const fetchHistories = async () => {
    try {
      const res = await fetch('/api/sms?limit=50');
      const data = await res.json();
      if (data.success) {
        setHistories(data.data);
      }
    } catch (error) {
      console.error('발송 이력 조회 오류:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'templates') {
      fetchTemplates().finally(() => setLoading(false));
    } else {
      fetchHistories().finally(() => setLoading(false));
    }
  }, [tab]);

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate?.id
        ? `/api/sms/templates/${editingTemplate.id}`
        : '/api/sms/templates';
      const method = editingTemplate?.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingTemplate(null);
        setForm({
          name: '',
          code: '',
          category: 'general',
          content: '',
          isActive: true,
          isAuto: false,
        });
        fetchTemplates();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('템플릿 저장 오류:', error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/sms/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('템플릿 삭제 오류:', error);
    }
  };

  const openEditModal = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      code: template.code,
      category: template.category,
      content: template.content,
      isActive: template.isActive,
      isAuto: template.isAuto,
    });
    setShowModal(true);
  };

  return (
    <AdminLayout activeMenu="settings">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📱 SMS 관리</h1>
        <Link
          href="/admin/settings"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← 설정
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('templates')}
          className={`px-4 py-2 rounded ${
            tab === 'templates'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📝 템플릿 관리
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded ${
            tab === 'history'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📋 발송 이력
        </button>
      </div>

      {/* 템플릿 관리 */}
      {tab === 'templates' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setForm({
                  name: '',
                  code: '',
                  category: 'general',
                  content: '',
                  isActive: true,
                  isAuto: false,
                });
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + 템플릿 추가
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">코드</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">카테고리</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">내용</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">자동발송</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      등록된 템플릿이 없습니다.
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{template.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{template.code}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {categoryLabels[template.category] || template.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {template.content}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            template.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {template.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {template.isAuto && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            자동
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => openEditModal(template)}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 변수 안내 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">📌 사용 가능한 변수</h3>
            <div className="text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><code>{'{storeName}'}</code> - 가맹점명</div>
              <div><code>{'{orderNo}'}</code> - 주문번호</div>
              <div><code>{'{productName}'}</code> - 상품명</div>
              <div><code>{'{amount}'}</code> - 금액</div>
              <div><code>{'{trackingNo}'}</code> - 운송장번호</div>
              <div><code>{'{courier}'}</code> - 택배사</div>
              <div><code>{'{date}'}</code> - 날짜</div>
              <div><code>{'{time}'}</code> - 시간</div>
            </div>
          </div>
        </>
      )}

      {/* 발송 이력 */}
      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">발송일시</th>
                <th className="px-4 py-3 text-left text-sm font-medium">수신번호</th>
                <th className="px-4 py-3 text-left text-sm font-medium">가맹점</th>
                <th className="px-4 py-3 text-left text-sm font-medium">주문번호</th>
                <th className="px-4 py-3 text-left text-sm font-medium">내용</th>
                <th className="px-4 py-3 text-center text-sm font-medium">타입</th>
                <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium">발송자</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    발송 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                histories.map((history) => (
                  <tr key={history.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(history.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">{history.phone}</td>
                    <td className="px-4 py-3 text-sm">{history.storeName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{history.orderNo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {history.message}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs uppercase">
                        {history.sendType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          statusLabels[history.status]?.color || 'bg-gray-100'
                        }`}
                      >
                        {statusLabels[history.status]?.label || history.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{history.sentBy || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 템플릿 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate?.id ? '템플릿 수정' : '템플릿 추가'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">템플릿명 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="예: 주문 접수 알림"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">템플릿 코드 *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="예: order_confirm"
                  disabled={!!editingTemplate?.id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">카테고리</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="general">일반</option>
                  <option value="order">주문</option>
                  <option value="shipping">배송</option>
                  <option value="payment">결제</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">내용 *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full border rounded px-3 py-2 h-32"
                  placeholder="[렌즈초이스] {storeName}님, 주문번호 {orderNo}가 접수되었습니다."
                />
                <p className="text-xs text-gray-500 mt-1">
                  90자 이상 시 LMS로 발송됩니다. (현재: {form.content.length}자)
                </p>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="text-sm">활성화</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isAuto}
                    onChange={(e) => setForm({ ...form, isAuto: e.target.checked })}
                  />
                  <span className="text-sm">자동 발송</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
