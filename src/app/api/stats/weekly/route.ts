import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const now = new Date()
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const completedTasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        status: 'done',
        completedAt: { gte: startOfWeek },
        actualSeconds: { not: null },
      },
    })

    const stats: Record<string, number> = {}
    for (const task of completedTasks) {
      const tag = task.subjectTag || '未分类'
      stats[tag] = (stats[tag] || 0) + (task.actualSeconds || 0)
    }

    const result = Object.entries(stats)
      .map(([tag, seconds]) => ({ tag, minutes: Math.round(seconds / 60) }))
      .sort((a, b) => b.minutes - a.minutes)

    const totalMinutes = result.reduce((sum, item) => sum + item.minutes, 0)

    return NextResponse.json({
      weekStart: startOfWeek.toISOString().split('T')[0],
      totalMinutes,
      byTag: result,
    })
  } catch (error) {
    console.error('获取周统计失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}