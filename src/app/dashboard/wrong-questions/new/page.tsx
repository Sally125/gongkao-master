'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ERROR_REASONS = ['计算失误', '知识点盲区', '审题不清', '粗心大意', '概念混淆', '方法错误']
const QUESTION_MODULES = ['资料分析', '言语理解', '数量关系', '判断推理', '常识判断', '申论']

export default function NewWrongQuestionPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  const [question, setQuestion] = useState('')
  const [questionType, setQuestionType] = useState<'text' | 'image' | 'ocr'>('text')
  const [myAnswer, setMyAnswer] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [errorReason, setErrorReason] = useState('')
  const [questionModule, setQuestionModule] = useState('')
  const [isGuessed, setIsGuessed] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/wrong-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          questionType,
          myAnswer,
          correctAnswer,
          errorReason,
          questionModule,
          isGuessed,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || '保存失败', 'error')
        return
      }

      // 已收录反馈动效
      setShowSaved(true)
      setTimeout(() => {
        router.push('/dashboard/wrong-questions')
      }, 1000)
    } catch {
      showToast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mr-4"
        >
          ← 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900">录入错题</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-5">
          {/* 题干输入方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">题干输入方式</label>
            <div className="flex gap-2">
              {(['text', 'image', 'ocr'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQuestionType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    questionType === type
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'text' ? '手动输入' : type === 'image' ? '拍照存图' : '拍照+OCR'}
                </button>
              ))}
            </div>
          </div>

          {/* 题干 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">题干内容 *</label>
            {questionType === 'text' || questionType === 'ocr' ? (
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                placeholder="输入题干内容"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2"></div>
                <p className="text-sm text-gray-500">拍照功能开发中，请先使用手动输入</p>
              </div>
            )}
          </div>

          {/* 我的答案 + 正确答案 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">我的答案 *</label>
              <input
                type="text"
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="你填的答案"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">正确答案 *</label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="标准答案"
              />
            </div>
          </div>

          {/* 错误原因 + 题型模块 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">错误原因 *</label>
              <select
                value={errorReason}
                onChange={(e) => setErrorReason(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="">请选择</option>
                {ERROR_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">题型/知识模块 *</label>
              <select
                value={questionModule}
                onChange={(e) => setQuestionModule(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="">请选择</option>
                {QUESTION_MODULES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 蒙对标记 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isGuessed}
                onChange={(e) => setIsGuessed(e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">蒙对标记（答对但不理解，需要复习）</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>

      {/* 已收录反馈动效 */}
      {showSaved && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-bounce">
            <div className="text-5xl mb-3">✓</div>
            <p className="text-lg font-bold text-gray-900">已收录</p>
          </div>
        </div>
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