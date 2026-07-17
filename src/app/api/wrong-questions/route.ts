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
    const errorReason = searchParams.get('errorReason')
    const questionModule = searchParams.get('questionModule')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (errorReason) where.errorReason = errorReason
    if (questionModule) where.questionModule = questionModule

    const [questions, errorReasons, questionModules] = await Promise.all([
      prisma.wrongQuestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wrongQuestion.findMany({
        where: { userId: session.user.id },
        select: { errorReason: true },
        distinct: ['errorReason'],
      }),
      prisma.wrongQuestion.findMany({
        where: { userId: session.user.id },
        select: { questionModule: true },
        distinct: ['questionModule'],
      }),
    ])

    return NextResponse.json({
      questions,
      errorReasons: errorReasons.map((r) => r.errorReason),
      questionModules: questionModules.map((m) => m.questionModule),
    })
  } catch (error) {
    console.error('获取错题列表失败:', error)
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
    const { question, questionType = 'text', myAnswer, correctAnswer, errorReason, questionModule, isGuessed = false } = body

    if (!question || !myAnswer || !correctAnswer || !errorReason || !questionModule) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 })
    }

    const wq = await prisma.wrongQuestion.create({
      data: {
        userId: session.user.id,
        question,
        questionType,
        myAnswer,
        correctAnswer,
        errorReason,
        questionModule,
        isGuessed,
      },
    })

    return NextResponse.json({ question: wq }, { status: 201 })
  } catch (error) {
    console.error('创建错题失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}