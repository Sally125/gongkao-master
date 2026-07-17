'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const ERROR_REASONS = ['计算失误', '知识点盲区', '审题不清', '粗心大意', '概念混淆', '方法错误']
const QUESTION_MODULES = ['资料分析', '言语理解', '数量关系', '判断推理', '常识判断', '申论']

interface WrongQuestion {
  id: string
  question: string
  questionType: string
  myAnswer: string
  correctAnswer: string
  errorReason: string
  questionModule: string
  isGuessed: boolean
  createdAt: string
}

export default function WrongQuestionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [question, setQuestion] = useState<WrongQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [errorReason, setErrorReason] = useState('')
  const [questionModule, setQuestionModule] = useState('')
  const [isGuessed, setIsGuessed] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch(`/api/wrong-questions/${id}`)
        if (res.ok) {
          const data = await res.json()
          setQuestion(data.question)
          setErrorReason(data.question.errorReason)
          setQuestionModule(data.question.questionModule)
          setIsGuessed(data.question.isGuessed)
        }
      } catch (error) {
        console.error('获取错题详情失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchQuestion()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/wrong-questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorReason, questionModule, isGuessed }),
      })

      if (res.ok) {
        showToast('修改成功')
        setEditing(false)
      } else {
        showToast('修改失败', 'error')
      }
    } catch {
      showToast('修改失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这道错题吗？')) return

    try {
      const res = await fetch(`/api/wrong-questions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/wrong-questions')
      }
    } catch (error) {
      console.error('删除错题失败:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!question) {
    return (
      <div className="text-center py-12 text-gray-500">错题不存在</div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700 mr-4"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-900">错题详情</h1>
        </div>
        <button
          onClick={handleDelete}
          className="text-sm text-danger hover:underline"
        >
          删除
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{question.questionModule}</span>
          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">{question.errorReason}</span>
          {question.isGuessed && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">蒙对</span>
          )}
        </div>

        {/* 题干 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">题干</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{question.question}</p>
          </div>
        </div>

        {/* 答案对比 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">我的答案</h3>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-600 font-medium">{question.myAnswer}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">正确答案</h3>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-600 font-medium">{question.correctAnswer}</p>
            </div>
          </div>
        </div>

        {/* 录入时间 */}
        <div className="text-xs text-gray-400 mb-6">
          录入时间：{new Date(question.createdAt).toLocaleString('zh-CN')}
        </div>

        {/* 编辑区域 */}
        {editing ? (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">编辑分类</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">错误原因</label>
                <select
                  value={errorReason}
                  onChange={(e) => setErrorReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {ERROR_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题型/知识模块</label>
                <select
                  value={questionModule}
                  onChange={(e) => setQuestionModule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {QUESTION_MODULES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGuessed}
                    onChange={(e) => setIsGuessed(e.target.checked)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">蒙对标记</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-primary hover:underline"
          >
            编辑分类
          </button>
        )}
      </div>

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