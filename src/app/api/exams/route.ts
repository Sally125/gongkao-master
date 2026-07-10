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
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const parsedExams = exams.map((exam) => ({
      ...exam,
      nodes: JSON.parse(exam.nodes),
    }))

    return NextResponse.json({ exams: parsedExams })
  } catch (error) {
    console.error('获取考试列表失败:', error)
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
    const { examName, nodes, isEnabled = true } = body

    if (!examName) {
      return NextResponse.json({ error: '考试名称不能为空' }, { status: 400 })
    }

    const exam = await prisma.exam.create({
      data: {
        userId: session.user.id,
        examName,
        nodes: JSON.stringify(nodes || {}),
        isEnabled,
      },
    })

    return NextResponse.json({ exam }, { status: 201 })
  } catch (error) {
    console.error('创建考试失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}