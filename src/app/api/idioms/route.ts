import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/idioms - 新增成语
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { word, meaning, notes } = body

    if (!word || !meaning) {
      return NextResponse.json({ error: '成语和释义不能为空' }, { status: 400 })
    }

    // 检查重复
    const existing = await prisma.idiom.findFirst({
      where: { userId: session.user.id, word },
    })

    if (existing) {
      return NextResponse.json({ error: '该成语已存在' }, { status: 400 })
    }

    // 首次学习，下次复习在1天后
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + 1)

    const idiom = await prisma.idiom.create({
      data: {
        userId: session.user.id,
        word,
        meaning,
        notes: notes || null,
        nextReviewDate: nextReview,
      },
    })

    return NextResponse.json({ idiom }, { status: 201 })
  } catch (error) {
    console.error('创建成语失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

// GET /api/idioms - 获取所有成语（支持搜索）
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (q) {
      where.OR = [
        { word: { contains: q } },
        { meaning: { contains: q } },
        { notes: { contains: q } },
      ]
    }

    const idioms = await prisma.idiom.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ idioms })
  } catch (error) {
    console.error('获取成语列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}