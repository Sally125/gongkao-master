import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const article = await prisma.article.findUnique({
      where: { id: params.id },
    })

    if (!article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json({ article })
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { analysis } = body

    const article = await prisma.article.update({
      where: { id: params.id },
      data: { analysis: analysis ? JSON.stringify(analysis) : undefined },
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('更新文章失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}