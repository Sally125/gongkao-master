'use client'

import { useState, useEffect } from 'react'

interface Idiom {
  id: string
  word: string
  meaning: string
  notes: string | null
  reviewStage: number
  nextReviewDate: string
  isMastered: boolean
}

export default function ReviewPage() {
  const [allIdioms, setAllIdioms] = useState<Idiom[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reviewing, setReviewing] = useState(false)
  const [reviewIdioms, setReviewIdioms] = useState<Idiom[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchAllIdioms = async () => {
    try {
      const res = await fetch('/api/idioms')
      if (res.ok) {
        const data = await res.json()
        setAllIdioms(data.idioms)
      }
    } catch {
      showToast('获取成语列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllIdioms()
  }, [])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const selectAll = () => {
    if (selectedIds.size === allIdioms.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allIdioms.map((i) => i.id)))
    }
  }

  const startReview = async () => {
    if (selectedIds.size === 0) {
      showToast('请先选择要复习的成语', 'error')
      return
    }

    try {
      const res = await fetch(`/api/review/today?ids=${Array.from(selectedIds).join(',')}`)
      if (res.ok) {
        const data = await res.json()
        if (data.idioms.length > 0) {
          setReviewIdioms(data.idioms)
          setCurrentIndex(0)
          setFlipped(false)
          setReviewing(true)
        } else {
          showToast('未找到所选成语', 'error')
        }
      }
    } catch {
      showToast('获取复习列表失败', 'error')
    }
  }

  const handleResult = async (result: 'know' | 'forgot') => {
    if (processing) return
    setProcessing(true)

    try {
      const res = await fetch('/api/review/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idiomId: reviewIdioms[currentIndex].id, result }),
      })

      if (!res.ok) {
        showToast('记录失败', 'error')
        return
      }

      if (currentIndex < reviewIdioms.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setFlipped(false)
      } else {
        showToast('复习完成 ✅')
        setReviewing(false)
        setSelectedIds(new Set())
        fetchAllIdioms()
      }
    } catch {
      showToast('记录失败', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>

  // 复习模式
  if (reviewing && reviewIdioms.length > 0) {
    const current = reviewIdioms[currentIndex]

    return (
      <div className="max-w-md mx-auto pb-24">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setReviewing(false)}
            className="text-sm text-primary hover:underline"
          >
            ← 返回选择
          </button>
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {reviewIdioms.length}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / reviewIdioms.length) * 100}%` }}
          />
        </div>

        <div
          className="bg-white rounded-2xl shadow-lg p-8 mb-8 cursor-pointer transition-transform active:scale-95"
          onClick={() => setFlipped(!flipped)}
        >
          {!flipped ? (
            <div className="text-center py-12">
              <div className="text-4xl font-bold text-gray-900 mb-4">{current.word}</div>
              <p className="text-sm text-gray-400">点击翻转查看释义</p>
            </div>
          ) : (
            <div className="py-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{current.word}</h2>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-500 mb-1">释义</div>
                <p className="text-gray-700">{current.meaning}</p>
              </div>
              {current.notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">备注</div>
                  <p className="text-gray-700 text-sm">{current.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {flipped && (
          <div className="flex gap-4">
            <button
              onClick={() => handleResult('forgot')}
              disabled={processing}
              className="flex-1 bg-red-500 text-white py-4 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              忘了
            </button>
            <button
              onClick={() => handleResult('know')}
              disabled={processing}
              className="flex-1 bg-green-500 text-white py-4 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              记得
            </button>
          </div>
        )}
      </div>
    )
  }

  // 选择模式
  const allSelected = selectedIds.size === allIdioms.length && allIdioms.length > 0

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">每日复习</h1>
        <span className="text-sm text-gray-500">
          {selectedIds.size} / {allIdioms.length} 已选
        </span>
      </div>

      {allIdioms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4"></div>
          <p className="text-gray-500 mb-4">还没有成语，先去添加</p>
          <a
            href="/dashboard/idioms"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            + 添加成语
          </a>
        </div>
      ) : (
        <>
          {/* 全选 + 开始复习 */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={selectAll}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="font-medium text-gray-700">全选</span>
            </label>
            <button
              onClick={startReview}
              disabled={selectedIds.size === 0}
              className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始复习
            </button>
          </div>

          {/* 成语列表 */}
          <div className="space-y-3">
            {allIdioms.map((idiom) => {
              const isSelected = selectedIds.has(idiom.id)
              return (
                <div
                  key={idiom.id}
                  onClick={() => toggleSelect(idiom.id)}
                  className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all border-2 ${
                    isSelected ? 'border-primary bg-primary-50' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(idiom.id)}
                      className="w-5 h-5 text-primary rounded focus:ring-primary flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{idiom.word}</h3>
                        {idiom.isMastered && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已掌握</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{idiom.meaning}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
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
