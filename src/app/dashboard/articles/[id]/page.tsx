'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Article {
  id: string
  title: string
  source: string
  url: string
  content: string
  domain: string
  analysis: string | null
}

interface Analysis {
  mainArgument: { text: string; startPos: number; endPos: number }
  subArguments: { text: string; startPos: number; endPos: number }[]
  goldenSentences: { text: string; startPos: number; endPos: number }[]
  normWords: string[]
  domain: string
}

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const contentRef = useRef<HTMLDivElement>(null)

  const [article, setArticle] = useState<Article | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'analysis'>('content')
  const [analyzing, setAnalyzing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`/api/articles/${id}`)
        if (res.ok) {
          const data = await res.json()
          setArticle(data.article)
          if (data.article.analysis) {
            setAnalysis(JSON.parse(data.article.analysis))
          }
        }
      } catch (error) {
        console.error('获取文章详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchArticle()
  }, [id])

  const handleAnalyze = async () => {
    if (!article) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/articles/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, content: article.content }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data.analysis)
        showToast('分析完成')
      }
    } catch {
      showToast('分析失败', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleTextSelect = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelectedText(text)
      setMenuPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 })
      setShowActionMenu(true)
    }
  }

  const handleAddMaterial = async (type: string) => {
    if (!article || !selectedText) return
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          type,
          content: selectedText,
          tags: [article.domain],
        }),
      })
      if (res.ok) {
        showToast('已添加到素材本')
      }
    } catch {
      showToast('添加失败', 'error')
    }
    setShowActionMenu(false)
  }

  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(selectedText)
      utterance.lang = 'zh-CN'
      window.speechSynthesis.speak(utterance)
    }
    setShowActionMenu(false)
  }

  // Render content with highlights
  const renderHighlightedContent = () => {
    if (!article || !analysis) return <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{article?.content}</p>

    const content = article.content
    const highlights: { start: number; end: number; className: string; label: string }[] = []

    // Main argument - red
    if (analysis.mainArgument) {
      highlights.push({
        start: analysis.mainArgument.startPos,
        end: analysis.mainArgument.endPos,
        className: 'bg-red-100 border-b-2 border-red-400 px-1',
        label: '总论点',
      })
    }

    // Sub arguments - blue
    analysis.subArguments?.forEach((arg) => {
      highlights.push({
        start: arg.startPos,
        end: arg.endPos,
        className: 'bg-blue-50 border-b-2 border-blue-400 px-1',
        label: '分论点',
      })
    })

    // Golden sentences - gold
    analysis.goldenSentences?.forEach((s) => {
      highlights.push({
        start: s.startPos,
        end: s.endPos,
        className: 'bg-yellow-100 border-b-2 border-yellow-400 px-1',
        label: '金句',
      })
    })

    // Sort by position and render
    highlights.sort((a, b) => a.start - b.start)

    const parts: JSX.Element[] = []
    let lastIndex = 0

    highlights.forEach((h, i) => {
      if (h.start > lastIndex) {
        parts.push(
          <span key={`t${i}`}>{content.slice(lastIndex, h.start)}</span>
        )
      }
      parts.push(
        <span
          key={`h${i}`}
          className={`${h.className} cursor-pointer relative group`}
          title={h.label}
        >
          {content.slice(h.start, h.end)}
        </span>
      )
      lastIndex = h.end
    })

    if (lastIndex < content.length) {
      parts.push(<span key="end">{content.slice(lastIndex)}</span>)
    }

    return <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{parts}</div>
  }

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>
  if (!article) return <div className="text-center py-12 text-gray-500">文章不存在</div>

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mr-4">← 返回</button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">{article.title}</h1>
      </div>

      <div className="text-xs text-gray-400 mb-4">{article.source} · {article.domain}</div>

      {/* 移动端 Tab 切换 */}
      <div className="flex gap-2 mb-4 md:hidden">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'content' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          原文
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'analysis' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          拆解
        </button>
      </div>

      <div className="flex gap-6">
        {/* 原文区 */}
        <div className={`flex-1 ${activeTab !== 'content' ? 'hidden md:block' : ''}`}>
          <div
            ref={contentRef}
            className="bg-white rounded-xl shadow-sm p-6"
            onMouseUp={handleTextSelect}
          >
            {renderHighlightedContent()}
          </div>
          {/* 来源链接 */}
          {article.url && (
            <div className="mt-4 text-center">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                查看原文来源：{article.source}
              </a>
            </div>
          )}
          {!analysis && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="mt-4 w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {analyzing ? '分析中...' : 'AI 智能拆解'}
            </button>
          )}
        </div>

        {/* 拆解面板 */}
        {analysis && (
          <div className={`w-full md:w-80 flex-shrink-0 ${activeTab !== 'analysis' ? 'hidden md:block' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4">AI 拆解</h3>

              {/* 总论点 */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-1">总论点</h4>
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{analysis.mainArgument.text}</p>
              </div>

              {/* 分论点 */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-1">分论点</h4>
                {analysis.subArguments.map((arg, i) => (
                  <p key={i} className="text-sm text-blue-600 bg-blue-50 p-2 rounded mb-1">{arg.text}</p>
                ))}
              </div>

              {/* 金句 */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-1">金句</h4>
                {analysis.goldenSentences.map((s, i) => (
                  <p key={i} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mb-1">{s.text}</p>
                ))}
              </div>

              {/* 规范词 */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">规范词</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.normWords.map((word, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{word}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作菜单 */}
      {showActionMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-xl p-2 min-w-[160px]"
            style={{ left: menuPosition.x - 80, top: menuPosition.y - 100 }}
          >
            <button onClick={() => handleAddMaterial('golden_sentence')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">收藏为金句</button>
            <button onClick={() => handleAddMaterial('norm_word')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">收藏为规范词</button>
            <button onClick={() => handleAddMaterial('case')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">收藏为案例</button>
            <button onClick={handleReadAloud} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">朗读</button>
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}