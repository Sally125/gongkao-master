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

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { title, priority, estimatedMinutes, deadline, subjectTag, status, sortOrder, action } = body

    let updateData: Record<string, unknown> = {
      ...(title !== undefined && { title }),
      ...(priority !== undefined && { priority }),
      ...(estimatedMinutes !== undefined && { estimatedMinutes }),
      ...(deadline !== undefined && { deadline }),
      ...(subjectTag !== undefined && { subjectTag }),
      ...(sortOrder !== undefined && { sortOrder }),
    }

    if (status && status !== existing.status) {
      updateData.enteredAt = new Date()
    }

    if (action === 'start') {
      updateData = {
        ...updateData,
        status: 'doing',
        startedAt: new Date(),
        pausedAt: null,
        totalPausedSeconds: 0,
        enteredAt: new Date(),
      }
    } else if (action === 'pause') {
      updateData = {
        ...updateData,
        pausedAt: new Date(),
      }
    } else if (action === 'resume') {
      if (existing.pausedAt) {
        const pausedDuration = Math.floor(
          (new Date().getTime() - new Date(existing.pausedAt).getTime()) / 1000
        )
        updateData = {
          ...updateData,
          pausedAt: null,
          totalPausedSeconds: existing.totalPausedSeconds + pausedDuration,
        }
      }
    } else if (action === 'done') {
      updateData = {
        ...updateData,
        status: 'done',
        completedAt: new Date(),
        pausedAt: null,
        enteredAt: new Date(),
      }
      if (existing.startedAt) {
        const now = Date.now()
        const started = new Date(existing.startedAt).getTime()
        const elapsed = Math.floor((now - started) / 1000) - existing.totalPausedSeconds
        updateData.actualSeconds = Math.max(0, elapsed)
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('更新任务失败:', error)
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

    const existing = await prisma.task.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}