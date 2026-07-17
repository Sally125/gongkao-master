import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/daily-cards - 获取今日背诵卡片
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const now = new Date()

    // 获取今日待复习或新建的卡片
    const cards = await prisma.dailyCard.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { nextReview: { lte: now } },
          { reviewStage: 0 },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({ cards, count: cards.length })
  } catch (error) {
    console.error('获取背诵卡片失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// POST /api/daily-cards - 添加卡片（从文章提取）
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { articleId, content, source, topic } = body

    if (!content || !source) {
      return NextResponse.json({ error: '内容和出处不能为空' }, { status: 400 })
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + 1)

    const card = await prisma.dailyCard.create({
      data: {
        userId: session.user.id,
        articleId: articleId || null,
        content,
        source,
        topic: topic || '通用',
        nextReview,
      },
    })

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error('添加卡片失败:', error)
    return NextResponse.json({ error: '添加失败' }, { status: 500 })
  }
}