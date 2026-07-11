import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CountdownBanner from '@/components/CountdownBanner'
import NotificationReminder from '@/components/NotificationReminder'
import WeeklyStats from '@/components/WeeklyStats'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="max-w-7xl mx-auto">
      <CountdownBanner />
      <NotificationReminder />

      <div className="bg-gradient-to-r from-primary to-primary-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          你好，{session.user?.name || '同学'} 👋
        </h1>
        <p className="opacity-90">今天也要加油备考哦！</p>
      </div>

      <WeeklyStats />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📅</span>
            <h3 className="font-bold text-gray-900">学习计划</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">制定并管理你的学习计划</p>
          <a href="/dashboard/plans" className="text-primary text-sm font-medium hover:underline">
            前往 →
          </a>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📝</span>
            <h3 className="font-bold text-gray-900">复盘记录</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">记录每日学习心得与总结</p>
          <a href="/dashboard/reviews" className="text-primary text-sm font-medium hover:underline">
            前往 →
          </a>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📊</span>
            <h3 className="font-bold text-gray-900">数据统计</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">可视化你的备考数据</p>
          <a href="/dashboard/stats" className="text-primary text-sm font-medium hover:underline">
            前往 →
          </a>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📋</span>
            <h3 className="font-bold text-gray-900">考试管理</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">管理目标考试与倒计时</p>
          <a href="/dashboard/exams" className="text-primary text-sm font-medium hover:underline">
            前往 →
          </a>
        </div>
      </div>
    </div>
  )
}