import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const exams = await prisma.exam.findMany({
      where: {
        userId: session.user.id,
        isEnabled: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 找到最近一场笔试还未过的考试
    const now = new Date()
    const upcomingExam = exams.find((exam) => {
      const nodes = JSON.parse(exam.nodes) as Record<string, string>
      if (!nodes.writtenExam) return false
      const writtenDate = new Date(nodes.writtenExam + 'T09:00:00')
      return writtenDate > now
    })

    if (upcomingExam) {
      return NextResponse.json({ exam: { ...upcomingExam, nodes: JSON.parse(upcomingExam.nodes) } })
    }

    return NextResponse.json({ exam: null })
  } catch (error) {
    console.error('获取考试信息失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}