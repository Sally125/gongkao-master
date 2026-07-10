import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const existing = await prisma.exam.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '考试不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { examName, nodes, isEnabled } = body

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: {
        ...(examName !== undefined && { examName }),
        ...(nodes !== undefined && { nodes: JSON.stringify(nodes) }),
        ...(isEnabled !== undefined && { isEnabled }),
      },
    })

    return NextResponse.json({ exam: { ...exam, nodes: JSON.parse(exam.nodes) } })
  } catch (error) {
    console.error('更新考试失败:', error)
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

    const existing = await prisma.exam.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '考试不存在' }, { status: 404 })
    }

    await prisma.exam.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除考试失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}