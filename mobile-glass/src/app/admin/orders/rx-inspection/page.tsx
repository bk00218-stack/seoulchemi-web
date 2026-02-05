'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RxInspection {
  id: number;
  orderId: number;
  orderNo: string;
  orderItemId: number;
  status: string;
  sphOrdered: string | null;
  cylOrdered: string | null;
  axisOrdered: string | null;
  sphMeasured: string | null;
  cylMeasured: string | null;
  axisMeasured: string | null;
  failReason: string | null;
  inspectedBy: string | null;
  inspectedAt: string | null;
  reprocessCount: number;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-gray-100 text-gray-800' },
  passed: { label: '합격', color: 'bg-green-100 text-green-800' },
  failed: { label: '불합격', color: 'bg-red-100 text-red-800' },
  reprocess: { label: '재가공', color: 'bg-yellow-100 text-yellow-800' },
};

export default function RxInspectionPage() {
  const [inspections, setInspections] = useState<RxInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    orderNo: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.orderNo) params.append('orderNo', filter.orderNo);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const res = await fetch(`/api/rx-inspection?${params}`);
      const data = await res.json();

      if (data.success) {
        setInspections(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('검수 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [pagination.page, filter.status]);

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchInspections();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/rx-inspection/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, inspectedBy: 'admin' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInspections();
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔬 RX 검수 관리</h1>
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← 주문 목록
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">상태</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="passed">합격</option>
              <option value="failed">불합격</option>
              <option value="reprocess">재가공</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">주문번호</label>
            <input
              type="text"
              value={filter.orderNo}
              onChange={(e) => setFilter({ ...filter, orderNo: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="주문번호 검색"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">시작일</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">종료일</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(statusLabels).map(([key, { label, color }]) => {
          const count = inspections.filter((i) => i.status === key).length;
          return (
            <div key={key} className="bg-white rounded-lg shadow p-4 text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                {label}
              </div>
              <div className="text-2xl font-bold mt-2">{count}</div>
            </div>
          );
        })}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">주문번호</th>
              <th className="px-4 py-3 text-left text-sm font-medium">상태</th>
              <th className="px-4 py-3 text-center text-sm font-medium">주문 도수</th>
              <th className="px-4 py-3 text-center text-sm font-medium">실측 도수</th>
              <th className="px-4 py-3 text-left text-sm font-medium">불합격 사유</th>
              <th className="px-4 py-3 text-left text-sm font-medium">검수자</th>
              <th className="px-4 py-3 text-left text-sm font-medium">검수일</th>
              <th className="px-4 py-3 text-center text-sm font-medium">재가공</th>
              <th className="px-4 py-3 text-center text-sm font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : inspections.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  검수 기록이 없습니다.
                </td>
              </tr>
            ) : (
              inspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${inspection.orderId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inspection.orderNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusLabels[inspection.status]?.color || 'bg-gray-100'
                      }`}
                    >
                      {statusLabels[inspection.status]?.label || inspection.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <div>S: {inspection.sphOrdered || '-'}</div>
                    <div>C: {inspection.cylOrdered || '-'}</div>
                    <div>A: {inspection.axisOrdered || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <div>S: {inspection.sphMeasured || '-'}</div>
                    <div>C: {inspection.cylMeasured || '-'}</div>
                    <div>A: {inspection.axisMeasured || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    {inspection.failReason || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{inspection.inspectedBy || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {inspection.inspectedAt
                      ? new Date(inspection.inspectedAt).toLocaleString('ko-KR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inspection.reprocessCount > 0 && (
                      <span className="text-yellow-600 font-medium">
                        {inspection.reprocessCount}회
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inspection.status === 'pending' && (
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleStatusChange(inspection.id, 'passed')}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          합격
                        </button>
                        <button
                          onClick={() => handleStatusChange(inspection.id, 'failed')}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          불합격
                        </button>
                      </div>
                    )}
                    {inspection.status === 'failed' && (
                      <button
                        onClick={() => handleStatusChange(inspection.id, 'reprocess')}
                        className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                      >
                        재가공
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
