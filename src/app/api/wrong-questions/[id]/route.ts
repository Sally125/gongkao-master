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

    const wq = await prisma.wrongQuestion.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!wq) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 })
    }

    return NextResponse.json({ question: wq })
  } catch (error) {
    console.error('获取错题详情失败:', error)
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

    const existing = await prisma.wrongQuestion.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { errorReason, questionModule, isGuessed } = body

    const wq = await prisma.wrongQuestion.update({
      where: { id: params.id },
      data: {
        ...(errorReason !== undefined && { errorReason }),
        ...(questionModule !== undefined && { questionModule }),
        ...(isGuessed !== undefined && { isGuessed }),
      },
    })

    return NextResponse.json({ question: wq })
  } catch (error) {
    console.error('更新错题失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const existing = await prisma.wrongQuestion.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '错题不存在' }, { status: 404 })
    }

    await prisma.wrongQuestion.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除错题失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}