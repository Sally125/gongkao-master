import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const DOMAINS = ['基层治理', '科技创新', '民生保障', '生态文明', '法治建设', '文化自信']

// 不自动生成假数据，由用户手动添加真实文章
async function ensureSeedData() {
  return
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    await ensureSeedData()

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    const where: Record<string, unknown> = {}
    if (domain) where.domain = domain

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishDate: 'desc' },
    })

    return NextResponse.json({ articles, domains: DOMAINS })
  } catch (error) {
    console.error('获取文章列表失败:', error)
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
    const { title, source, url, author, content, domain, publishDate } = body

    if (!title || !content || !domain) {
      return NextResponse.json({ error: '标题、内容和领域不能为空' }, { status: 400 })
    }

    const article = await prisma.article.create({
      data: {
        title,
        source: source || '其他',
        url: url || '',
        author: author || null,
        content,
        domain,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
      },
    })

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error('创建文章失败:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}