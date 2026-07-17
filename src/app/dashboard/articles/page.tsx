'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  source: string
  domain: string
  publishDate: string
  author: string | null
}

const domainColors: Record<string, string> = {
  '基层治理': 'bg-blue-100 text-blue-700',
  '科技创新': 'bg-purple-100 text-purple-700',
  '民生保障': 'bg-green-100 text-green-700',
  '生态文明': 'bg-emerald-100 text-emerald-700',
  '法治建设': 'bg-orange-100 text-orange-700',
  '文化自信': 'bg-pink-100 text-pink-700',
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('')
  const [fetching, setFetching] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const fetchArticles = async () => {
    try {
      const params = selectedDomain ? `?domain=${encodeURIComponent(selectedDomain)}` : ''
      const res = await fetch(`/api/articles${params}`)
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles)
        setDomains(data.domains)
      }
    } catch (error) {
      console.error('获取文章列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [selectedDomain])

  const handleFetchRss = async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/articles/fetch-rss')
      const data = await res.json()
      if (res.ok) {
        showToast(data.message)
      } else {
        showToast('抓取失败', 'error')
      }
    } catch {
      showToast('抓取失败', 'error')
    } finally {
      setFetching(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">申论积累</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchRss}
            disabled={fetching}
            className="text-sm border border-primary text-primary px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {fetching ? '抓取中...' : '每日推送'}
          </button>
          <Link
            href="/dashboard/articles/new"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            + 添加文章
          </Link>
        </div>
      </div>

      {/* 领域筛选标签栏 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedDomain('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedDomain ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {domains.map((domain) => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedDomain === domain ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {domain}
          </button>
        ))}
      </div>

      {/* 文章列表 */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4"></div>
          <p className="text-gray-500 mb-2">暂无文章，点击下方按钮添加</p>
          <p className="text-gray-400 text-sm mb-6">
            打开人民日报网页，复制全文粘贴到录入表单中
          </p>
          <Link
            href="/dashboard/articles/new"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            + 添加第一篇文章
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/dashboard/articles/${article.id}`}
              className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded ${domainColors[article.domain] || 'bg-gray-100 text-gray-600'}`}>
                      {article.domain}
                    </span>
                    <span className="text-xs text-gray-400">{article.source}</span>
                    {article.author && <span className="text-xs text-gray-400">· {article.author}</span>}
                    <span className="text-xs text-gray-400">
                      {new Date(article.publishDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <span className="text-gray-300 text-xl flex-shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}