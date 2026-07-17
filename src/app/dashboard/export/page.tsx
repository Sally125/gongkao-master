'use client'

import { useState, useEffect } from 'react'

interface Material {
  id: string
  type: string
  content: string
  article: { title: string; domain: string }
}

const TYPE_LABELS: Record<string, string> = {
  golden_sentence: '金句',
  case: '案例',
  norm_word: '规范词',
  countermeasure: '对策',
}

export default function ExportPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch('/api/materials')
        if (res.ok) {
          const data = await res.json()
          setMaterials(data.materials)
        }
      } catch (error) {
        console.error('获取素材失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMaterials()
  }, [])

  const handleExport = () => {
    setShowPaywall(true)
  }

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>

  const previewMaterials = materials.slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">导出素材本</h1>

      {/* 免费预览 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">预览（前5条）</h2>
        {previewMaterials.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无素材可预览</p>
        ) : (
          <div className="space-y-3">
            {previewMaterials.map((m, i) => (
              <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-400 text-sm">{i + 1}.</span>
                <div>
                  <span className="text-xs bg-primary-100 text-primary px-2 py-0.5 rounded mr-2">{TYPE_LABELS[m.type]}</span>
                  <span className="text-xs text-gray-400">{m.article.title}</span>
                  <p className="text-sm text-gray-700 mt-1">{m.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 付费导出 */}
      <div className="bg-gradient-to-r from-primary to-primary-700 rounded-xl p-6 text-white text-center">
        <h3 className="font-bold text-lg mb-2">完整导出</h3>
        <p className="text-sm opacity-80 mb-4">共 {materials.length} 条素材，按主题分类的PDF文档</p>
        <button
          onClick={handleExport}
          className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          19.9元 永久导出
        </button>
      </div>

      {/* 付费弹窗 */}
      {showPaywall && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">开通永久导出</h3>
            <p className="text-sm text-gray-500 mb-4">付费后可随时导出所有素材为PDF文档，包含按主题分类的清单。</p>
            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-primary">19.9</span>
              <span className="text-sm text-gray-500 ml-1">元 / 永久</span>
            </div>
            <button
              onClick={() => { setShowPaywall(false); alert('支付功能开发中，敬请期待') }}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors mb-3"
            >
              立即支付
            </button>
            <button
              onClick={() => setShowPaywall(false)}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}
    </div>
  )
}