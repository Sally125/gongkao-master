import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// DELETE /api/idioms/[id] - 删除成语
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const existing = await prisma.idiom.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '成语不存在' }, { status: 404 })
    }

    await prisma.idiom.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除成语失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}