'use client'

import { useState, useEffect, useCallback } from 'react'

interface Idiom {
  id: string
  word: string
  meaning: string
  notes: string | null
  reviewStage: number
  nextReviewDate: string
  isMastered: boolean
  createdAt: string
}

export default function IdiomsPage() {
  const [idioms, setIdioms] = useState<Idiom[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [notes, setNotes] = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchIdioms = useCallback(async () => {
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/idioms${params}`)
      if (res.ok) {
        const data = await res.json()
        setIdioms(data.idioms)
      }
    } catch (error) {
      showToast('获取成语列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchIdioms()
  }, [fetchIdioms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/idioms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, meaning, notes: notes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || '添加失败', 'error')
        return
      }
      setWord('')
      setMeaning('')
      setNotes('')
      setShowForm(false)
      showToast('添加成功')
      fetchIdioms()
    } catch {
      showToast('添加失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/idioms/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('删除成功')
        fetchIdioms()
      } else {
        showToast('删除失败', 'error')
      }
    } catch {
      showToast('删除失败', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportPdf = async () => {
    try {
      const res = await fetch('/api/idioms/export-pdf')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'idiom-book.pdf'
        a.click()
        URL.revokeObjectURL(url)
        showToast('导出成功')
      } else {
        showToast('导出失败', 'error')
      }
    } catch {
      showToast('导出失败', 'error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">我的成语本</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPdf}
                className="text-sm text-primary hover:underline"
              >
                导出 PDF
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {showForm ? '取消' : '+ 添加'}
              </button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索成语、释义..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>

          {/* 添加表单 */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">添加易错成语</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成语 *</label>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="如：不以为然"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">释义 *</label>
                  <textarea
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                    placeholder="成语的含义"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="如：和不以为意混淆"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          )}

          {/* 成语列表 */}
          {idioms.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-4xl mb-4"></div>
              <p className="text-gray-500 mb-4">还没有成语，开始记录你的易错成语吧</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                + 添加第一个成语
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {idioms.map((idiom) => (
                <div
                  key={idiom.id}
                  className={`bg-white rounded-xl shadow-sm p-4 transition-all ${
                    idiom.isMastered ? 'border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{idiom.word}</h3>
                        {idiom.isMastered && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已掌握</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{idiom.meaning}</p>
                      {idiom.notes && (
                        <p className="text-xs text-gray-400">💡 {idiom.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(idiom.id)}
                      disabled={deletingId === idiom.id}
                      className="text-xs text-gray-400 hover:text-danger transition-colors flex-shrink-0 ml-2"
                    >
                      {deletingId === idiom.id ? '...' : '删除'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white text-sm z-50 transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}