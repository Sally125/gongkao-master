'use client'

import { useState, useEffect } from 'react'

interface WeeklyStatsData {
  weekStart: string
  totalMinutes: number
  byTag: { tag: string; minutes: number }[]
}

const tagColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
]

export default function WeeklyStats() {
  const [stats, setStats] = useState<WeeklyStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats/weekly')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (error) {
        console.error('获取周统计失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return null
  if (!stats || stats.byTag.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">本周专注统计</h2>
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p>本周还没有完成的任务，开始学习吧！</p>
        </div>
      </div>
    )
  }

  const maxMinutes = Math.max(...stats.byTag.map((item) => item.minutes))

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">本周专注统计</h2>
          <p className="text-sm text-gray-500 mt-1">
            从 {stats.weekStart} 开始 · 总计 {stats.totalMinutes} 分钟
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{stats.totalMinutes}</div>
          <div className="text-xs text-gray-500">分钟</div>
        </div>
      </div>

      <div className="space-y-4">
        {stats.byTag.map((item, index) => {
          const percentage = maxMinutes > 0 ? (item.minutes / maxMinutes) * 100 : 0
          const color = tagColors[index % tagColors.length]

          return (
            <div key={item.tag}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.tag}</span>
                <span className="text-sm text-gray-500">{item.minutes} 分钟</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`${color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <a
          href="/dashboard/tasks"
          className="text-sm text-primary hover:underline"
        >
          查看任务详情 →
        </a>
      </div>
    </div>
  )
}