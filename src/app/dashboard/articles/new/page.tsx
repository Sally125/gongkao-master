'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddArticlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [title, setTitle] = useState('')
  const [source, setSource] = useState('人民日报')
  const [url, setUrl] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [domain, setDomain] = useState('基层治理')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          source,
          url,
          author: author || undefined,
          content,
          domain,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || '保存失败', 'error')
        return
      }

      showToast('文章添加成功')
      setTimeout(() => {
        router.push('/dashboard/articles')
      }, 1000)
    } catch {
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mr-4"
        >
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">添加文章</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="文章标题"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">来源</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="人民日报">人民日报</option>
                <option value="新华网">新华网</option>
                <option value="求是">求是</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">领域 *</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="基层治理">基层治理</option>
                <option value="科技创新">科技创新</option>
                <option value="民生保障">民生保障</option>
                <option value="生态文明">生态文明</option>
                <option value="法治建设">法治建设</option>
                <option value="文化自信">文化自信</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">原文链接</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="https://paper.people.com.cn/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="作者姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文章内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
              placeholder="粘贴文章全文内容..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存文章'}
          </button>
        </div>
      </form>

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