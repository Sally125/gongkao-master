import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/articles/fetch-rss - 从RSS源抓取文章
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 公开RSS源列表
    const rssSources = [
      {
        name: '人民日报-评论',
        url: 'https://rsshub.app/people/daily/11',
        domain: '基层治理',
      },
      {
        name: '新华网-时政',
        url: 'https://rsshub.app/xinhuanet/politics',
        domain: '法治建设',
      },
    ]

    const fetched: { title: string; link: string; source: string }[] = []

    for (const source of rssSources) {
      try {
        const res = await fetch(source.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GongKaoBot/1.0)' },
          signal: AbortSignal.timeout(5000),
        })

        if (!res.ok) continue

        const text = await res.text()

        // 简易XML解析
        const items = text.match(/<item>([\s\S]*?)<\/item>/g) || []

        for (const item of items.slice(0, 5)) {
          const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/)
          const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/)

          const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim()
          const link = (linkMatch?.[1] || '').trim()

          if (title && link) {
            fetched.push({ title, link, source: source.name })
          }
        }
      } catch {
        // 单个源失败不影响其他源
      }
    }

    return NextResponse.json({
      articles: fetched,
      message: fetched.length > 0
        ? `成功获取 ${fetched.length} 篇文章`
        : '未获取到文章（RSS源可能不可用），请通过"添加文章"手动录入',
    })
  } catch (error) {
    console.error('抓取RSS失败:', error)
    return NextResponse.json({ error: '抓取失败' }, { status: 500 })
  }
}