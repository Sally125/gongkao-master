import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// 艾宾浩斯固定间隔（天）：stage 0→1天, 1→2天, 2→4天, 3→7天, 4→15天, 5→30天, 6→已掌握
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]

// POST /api/review/record - 记录复习结果
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { idiomId, result } = body

    if (!idiomId || !result || !['know', 'forgot'].includes(result)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }

    const idiom = await prisma.idiom.findFirst({
      where: { id: idiomId, userId: session.user.id },
    })

    if (!idiom) {
      return NextResponse.json({ error: '成语不存在' }, { status: 404 })
    }

    let nextReviewDate: Date
    let reviewStage = idiom.reviewStage
    let isMastered = false

    if (result === 'know') {
      reviewStage = idiom.reviewStage + 1
      if (reviewStage >= REVIEW_INTERVALS.length) {
        // 完成所有阶段，标记已掌握
        isMastered = true
        nextReviewDate = new Date()
      } else {
        // 按间隔计算下次复习日期
        nextReviewDate = new Date()
        nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[reviewStage - 1])
      }
    } else {
      // 忘了，重置为 stage 0，明天重新复习
      reviewStage = 0
      nextReviewDate = new Date()
      nextReviewDate.setDate(nextReviewDate.getDate() + 1)
    }

    const updated = await prisma.idiom.update({
      where: { id: idiomId },
      data: {
        reviewStage,
        nextReviewDate,
        isMastered,
      },
    })

    return NextResponse.json({ idiom: updated })
  } catch (error) {
    console.error('记录复习失败:', error)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}