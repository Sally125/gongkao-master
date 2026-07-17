import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/review/today - 获取今日待复习成语（支持 ids 参数）
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    let idioms

    if (idsParam) {
      // 指定了 ids，直接返回指定成语
      const ids = idsParam.split(',').filter(Boolean)
      idioms = await prisma.idiom.findMany({
        where: {
          userId: session.user.id,
          id: { in: ids },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // 默认返回今日待复习
      const now = new Date()
      now.setHours(23, 59, 59, 999)
      idioms = await prisma.idiom.findMany({
        where: {
          userId: session.user.id,
          isMastered: false,
          nextReviewDate: { lte: now },
        },
        orderBy: { nextReviewDate: 'asc' },
      })
    }

    return NextResponse.json({ idioms, count: idioms.length })
  } catch (error) {
    console.error('获取复习列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}