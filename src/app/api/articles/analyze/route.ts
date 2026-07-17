import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST /api/articles/analyze - AI拆解文章
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { articleId, content } = body

    if (!content) {
      return NextResponse.json({ error: '文章内容不能为空' }, { status: 400 })
    }

    // 简易拆解逻辑（生产环境应调用Claude API）
    const paragraphs = content.split('\n').filter((p: string) => p.trim())
    const firstParagraph = paragraphs[0] || ''

    // 提取金句（包含"：""。"等标点的长句）
    const sentences = content.split(/[。！？]/).filter((s: string) => s.trim().length > 10)
    const goldenSentences = sentences.slice(0, 3).map((s: string, i: number) => {
      const startPos = content.indexOf(s)
      return { text: s.trim(), startPos, endPos: startPos + s.trim().length }
    })

    // 提取规范词（引号内的词或常见政治术语）
    const normWords: string[] = []
    const wordPatterns = ['数字化', '高质量发展', '治理体系', '服务群众', '基层治理', '科技创新', '民生保障']
    wordPatterns.forEach((word) => {
      if (content.includes(word)) normWords.push(word)
    })

    // 分论点提取
    const subArguments = paragraphs.slice(1, 4).map((p: string) => {
      const startPos = content.indexOf(p)
      return { text: p.trim().slice(0, 30), startPos, endPos: startPos + 30 }
    })

    const analysis = {
      mainArgument: {
        text: firstParagraph.slice(0, 40),
        startPos: 0,
        endPos: Math.min(40, firstParagraph.length),
      },
      subArguments,
      goldenSentences,
      normWords,
      domain: '基层治理',
    }

    // 保存分析结果
    if (articleId) {
      await prisma.article.update({
        where: { id: articleId },
        data: { analysis: JSON.stringify(analysis) },
      })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('分析文章失败:', error)
    return NextResponse.json({ error: '分析失败' }, { status: 500 })
  }
}