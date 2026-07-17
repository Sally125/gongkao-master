import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { jsPDF } from 'jspdf'

// GET /api/idioms/export-pdf - 导出成语本为 PDF
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const idioms = await prisma.idiom.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    const doc = new jsPDF()

    // 标题
    doc.setFontSize(18)
    doc.text('My Idiom Book', 105, 20, { align: 'center' })

    // 日期
    doc.setFontSize(10)
    doc.text(`Exported: ${new Date().toLocaleDateString('zh-CN')}`, 105, 30, { align: 'center' })

    // 表格
    let y = 45
    doc.setFontSize(12)

    // 表头
    doc.text('No.', 15, y)
    doc.text('Idiom', 35, y)
    doc.text('Meaning', 100, y)

    y += 5
    doc.line(15, y, 195, y)
    y += 8

    // 内容
    doc.setFontSize(10)
    idioms.forEach((idiom, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      doc.text(String(index + 1), 15, y)
      doc.text(idiom.word, 35, y)

      // 处理长文本
      const meaningLines = doc.splitTextToSize(idiom.meaning, 90)
      doc.text(meaningLines, 100, y)

      y += Math.max(meaningLines.length * 5, 5) + 3
    })

    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="idiom-book.pdf"',
      },
    })
  } catch (error) {
    console.error('导出 PDF 失败:', error)
    return NextResponse.json({ error: '导出失败' }, { status: 500 })
  }
}