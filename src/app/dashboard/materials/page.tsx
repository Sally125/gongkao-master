'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Material {
  id: string
  type: string
  content: string
  tags: string | null
  createdAt: string
  article: { title: string; domain: string }
}

const TYPE_LABELS: Record<string, string> = {
  golden_sentence: '金句',
  case: '案例',
  norm_word: '规范词',
  countermeasure: '对策',
}

const TYPE_FILTERS = [
  { key: '', label: '全部' },
  { key: 'golden_sentence', label: '金句' },
  { key: 'case', label: '案例' },
  { key: 'norm_word', label: '规范词' },
  { key: 'countermeasure', label: '对策' },
]

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchMaterials = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (search) params.set('q', search)

      const res = await fetch(`/api/materials?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data.materials)
      }
    } catch {
      showToast('获取素材失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterType, search])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条素材吗？')) return
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('删除成功')
        fetchMaterials()
      }
    } catch {
      showToast('删除失败', 'error')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">素材本</h1>
        <Link href="/dashboard/export" className="text-sm text-primary hover:underline">导出</Link>
      </div>

      {/* 搜索 */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索素材内容..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        />
      </div>

      {/* 类型筛选 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 素材列表 */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4"></div>
          <p className="text-gray-500 mb-4">还没有素材</p>
          <p className="text-gray-400 text-sm mb-6">去精读文章，点击高亮文本添加素材</p>
          <Link href="/dashboard/articles" className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            去精读文章
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-primary-100 text-primary px-2 py-0.5 rounded">{TYPE_LABELS[m.type] || m.type}</span>
                    <span className="text-xs text-gray-400">{m.article.title}</span>
                  </div>
                  <p className="text-sm text-gray-700">{m.content}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-gray-400 hover:text-danger ml-2 flex-shrink-0">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}