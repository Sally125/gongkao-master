'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/hooks/useNotification'

export default function NotificationReminder() {
  const { permission, requestPermission } = useNotification()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('notification-dismissed')
    if (wasDismissed) setDismissed(true)
  }, [])

  useEffect(() => {
    if (permission !== 'granted') return

    // 注册 service worker 用于定时通知（简化版：使用 setInterval 检查）
    const checkAndNotify = () => {
      // 通知逻辑由服务端或页面内处理
      // 这里仅作为客户端提醒的入口
    }

    const interval = setInterval(checkAndNotify, 60 * 60 * 1000) // 每小时检查
    return () => clearInterval(interval)
  }, [permission])

  if (permission === 'granted' || dismissed) return null
  if (permission === 'denied') return null

  return (
    <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔔</span>
        <p className="text-sm text-gray-700">
          开启浏览器通知，考前3天每天早8点提醒你
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={async () => {
            await requestPermission()
          }}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
        >
          开启通知
        </button>
        <button
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem('notification-dismissed', '1')
          }}
          className="text-gray-500 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          忽略
        </button>
      </div>
    </div>
  )
}