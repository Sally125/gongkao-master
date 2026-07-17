import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/materials - 获取用户素材本
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const topic = searchParams.get('topic')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (type) where.type = type
    if (topic) where.tags = { contains: topic }
    if (q) where.content = { contains: q }

    const materials = await prisma.userMaterial.findMany({
      where,
      include: { article: { select: { title: true, domain: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('获取素材列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

// POST /api/materials - 添加素材
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { articleId, type, content, tags } = body

    if (!articleId || !type || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    const material = await prisma.userMaterial.create({
      data: {
        userId: session.user.id,
        articleId,
        type,
        content,
        tags: tags ? JSON.stringify(tags) : null,
      },
    })

    return NextResponse.json({ material }, { status: 201 })
  } catch (error) {
    console.error('添加素材失败:', error)
    return NextResponse.json({ error: '添加失败' }, { status: 500 })
  }
}

// DELETE /api/materials?id=xxx - 删除素材
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少素材ID' }, { status: 400 })
    }

    await prisma.userMaterial.deleteMany({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除素材失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}