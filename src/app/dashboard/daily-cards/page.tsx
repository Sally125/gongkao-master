'use client'

import { useState, useEffect, useRef } from 'react'

interface DailyCard {
  id: string
  content: string
  source: string
  topic: string
  reviewStage: number
  nextReview: string
}

export default function DailyCardsPage() {
  const [cards, setCards] = useState<DailyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/daily-cards')
      if (res.ok) {
        const data = await res.json()
        setCards(data.cards)
      }
    } catch {
      showToast('获取卡片失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleResult = async (result: 'know' | 'forgot') => {
    if (processing) return
    setProcessing(true)

    try {
      const res = await fetch('/api/daily-cards/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: cards[currentIndex].id, result }),
      })

      if (!res.ok) {
        showToast('记录失败', 'error')
        return
      }

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setFlipped(false)
      } else {
        showToast('今日背诵完成 ✅')
        setCards([])
      }
    } catch {
      showToast('记录失败', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>

  if (cards.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">今日背诵完成</h2>
        <p className="text-gray-500">明天再来继续积累吧</p>
      </div>
    )
  }

  const current = cards[currentIndex]

  return (
    <div className="max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">每日背诵</h1>
        <div className="text-sm text-gray-500">{currentIndex + 1} / {cards.length}</div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
      </div>

      {/* 卡片 */}
      <div
        className="bg-white rounded-2xl shadow-lg p-8 mb-8 cursor-pointer transition-transform active:scale-95 min-h-[200px] flex items-center justify-center"
        onClick={() => setFlipped(!flipped)}
      >
        {!flipped ? (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">{current.content}</div>
            <p className="text-sm text-gray-400">点击翻转查看出处</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-500 mb-1">出处</div>
              <p className="text-gray-700 text-sm">{current.source}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">适用主题</div>
              <p className="text-gray-700 text-sm">{current.topic}</p>
            </div>
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
            再学一次
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