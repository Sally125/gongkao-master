import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tag = searchParams.get('tag')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status) where.status = status
    if (tag) where.subjectTag = tag

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { title, priority = '中', estimatedMinutes = 30, deadline, subjectTag, status = 'todo', source = 'manual', imageUrl } = body

    if (!title) {
      return NextResponse.json({ error: '任务标题不能为空' }, { status: 400 })
    }

    const maxOrder = await prisma.task.findFirst({
      where: { userId: session.user.id, status },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title,
        priority,
        estimatedMinutes,
        deadline: deadline || null,
        subjectTag: subjectTag || null,
        status,
        source,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('创建任务失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}