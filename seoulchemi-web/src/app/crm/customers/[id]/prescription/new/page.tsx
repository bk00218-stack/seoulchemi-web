'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface PrescriptionForm {
  measuredAt: string
  measuredBy: string
  // 우안 (OD)
  odSph: string
  odCyl: string
  odAxis: string
  odAdd: string
  odPd: string
  odVa: string
  // 좌안 (OS)
  osSph: string
  osCyl: string
  osAxis: string
  osAdd: string
  osPd: string
  osVa: string
  // 양안
  pdFar: string
  pdNear: string
  // 추가
  prescType: string
  complaints: string
  memo: string
}

// SPH/CYL 값 옵션 생성
const generateDiopter = (min: number, max: number, step: number = 0.25) => {
  const values: string[] = []
  for (let i = min; i <= max; i += step) {
    const val = i.toFixed(2)
    values.push(i >= 0 ? `+${val}` : val)
  }
  return values
}

const sphValues = generateDiopter(-20, 20, 0.25)
const cylValues = generateDiopter(-8, 0, 0.25)
const axisValues = Array.from({ length: 181 }, (_, i) => i.toString())
const addValues = generateDiopter(0.75, 3.5, 0.25)
const pdValues = Array.from({ length: 41 }, (_, i) => (50 + i).toString())

export default function NewPrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<PrescriptionForm>({
    measuredAt: new Date().toISOString().split('T')[0],
    measuredBy: '',
    odSph: '',
    odCyl: '',
    odAxis: '',
    odAdd: '',
    odPd: '',
    odVa: '',
    osSph: '',
    osCyl: '',
    osAxis: '',
    osAdd: '',
    osPd: '',
    osVa: '',
    pdFar: '',
    pdNear: '',
    prescType: 'glasses',
    complaints: '',
    memo: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch(`/api/crm/customers/${params.id}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '저장 실패')
      }
      
      alert('도수가 저장되었습니다')
      router.push(`/crm/customers/${params.id}`)
    } catch (error: any) {
      console.error(error)
      alert(error.message || '저장 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // OD값을 OS에 복사
  const copyOdToOs = () => {
    setForm(prev => ({
      ...prev,
      osSph: prev.odSph,
      osCyl: prev.odCyl,
      osAxis: prev.odAxis,
      osAdd: prev.odAdd,
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/crm/customers/${params.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">도수 기록</h1>
          <p className="text-gray-500">새로운 처방 정보를 입력하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 측정 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">측정 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">측정일</label>
              <input
                type="date"
                name="measuredAt"
                value={form.measuredAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">검안사</label>
              <input
                type="text"
                name="measuredBy"
                value={form.measuredBy}
                onChange={handleChange}
                placeholder="검안사명"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 처방값 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">처방값</h2>
            <button
              type="button"
              onClick={copyOdToOs}
              className="text-sm text-blue-600 hover:underline"
            >
              OD → OS 복사
            </button>
          </div>
          
          {/* 우안 (OD) */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">R</span>
              우안 (OD)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SPH</label>
                <select
                  name="odSph"
                  value={form.odSph}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {sphValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CYL</label>
                <select
                  name="odCyl"
                  value={form.odCyl}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {cylValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">AXIS</label>
                <select
                  name="odAxis"
                  value={form.odAxis}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {axisValues.map(v => <option key={v} value={v}>{v}°</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ADD</label>
                <select
                  name="odAdd"
                  value={form.odAdd}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {addValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PD</label>
                <select
                  name="odPd"
                  value={form.odPd}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {pdValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">VA</label>
                <input
                  type="text"
                  name="odVa"
                  value={form.odVa}
                  onChange={handleChange}
                  placeholder="1.0"
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 좌안 (OS) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">L</span>
              좌안 (OS)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">SPH</label>
                <select
                  name="osSph"
                  value={form.osSph}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {sphValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CYL</label>
                <select
                  name="osCyl"
                  value={form.osCyl}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {cylValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">AXIS</label>
                <select
                  name="osAxis"
                  value={form.osAxis}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {axisValues.map(v => <option key={v} value={v}>{v}°</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ADD</label>
                <select
                  name="osAdd"
                  value={form.osAdd}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {addValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">PD</label>
                <select
                  name="osPd"
                  value={form.osPd}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-</option>
                  {pdValues.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">VA</label>
                <input
                  type="text"
                  name="osVa"
                  value={form.osVa}
                  onChange={handleChange}
                  placeholder="1.0"
                  className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 양안 PD */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">양안 PD (원거리)</label>
              <select
                name="pdFar"
                value={form.pdFar}
                onChange={handleChange}
                className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-</option>
                {pdValues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">양안 PD (근거리)</label>
              <select
                name="pdNear"
                value={form.pdNear}
                onChange={handleChange}
                className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-</option>
                {pdValues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">추가 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">처방 유형</label>
              <select
                name="prescType"
                value={form.prescType}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="glasses">안경</option>
                <option value="contact">콘택트렌즈</option>
                <option value="both">둘다</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주요 불편사항</label>
              <input
                type="text"
                name="complaints"
                value={form.complaints}
                onChange={handleChange}
                placeholder="예: 근거리 작업 시 두통, 야간 운전 시 눈부심"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea
                name="memo"
                value={form.memo}
                onChange={handleChange}
                rows={3}
                placeholder="검안 관련 메모"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <Link
            href={`/crm/customers/${params.id}`}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? '저장 중...' : '도수 저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
