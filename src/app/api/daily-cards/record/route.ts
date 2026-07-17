import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/daily-cards/record - 记录复习结果
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { cardId, result } = body

    if (!cardId || !result || !['know', 'forgot'].includes(result)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }

    const card = await prisma.dailyCard.findFirst({
      where: { id: cardId, userId: session.user.id },
    })

    if (!card) {
      return NextResponse.json({ error: '卡片不存在' }, { status: 404 })
    }

    const INTERVALS = [1, 2, 4, 7, 15, 30]
    let reviewStage = card.reviewStage
    let nextReview = new Date()

    if (result === 'know') {
      reviewStage = Math.min(reviewStage + 1, INTERVALS.length)
      if (reviewStage < INTERVALS.length) {
        nextReview.setDate(nextReview.getDate() + INTERVALS[reviewStage - 1])
      }
    } else {
      reviewStage = 0
      nextReview.setDate(nextReview.getDate() + 1)
    }

    const updated = await prisma.dailyCard.update({
      where: { id: cardId },
      data: { reviewStage, nextReview },
    })

    return NextResponse.json({ card: updated })
  } catch (error) {
    console.error('记录复习失败:', error)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}