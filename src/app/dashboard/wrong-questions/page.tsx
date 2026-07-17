'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

const ERROR_REASONS = ['计算失误', '知识点盲区', '审题不清', '粗心大意', '概念混淆', '方法错误']
const QUESTION_MODULES = ['资料分析', '言语理解', '数量关系', '判断推理', '常识判断', '申论']

export default function WrongQuestionsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterReason, setFilterReason] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [errorReasons, setErrorReasons] = useState<string[]>([])
  const [questionModules, setQuestionModules] = useState<string[]>([])

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterReason) params.set('errorReason', filterReason)
      if (filterModule) params.set('questionModule', filterModule)

      const res = await fetch(`/api/wrong-questions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.questions)
        setErrorReasons(data.errorReasons)
        setQuestionModules(data.questionModules)
      }
    } catch (error) {
      console.error('获取错题列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [filterReason, filterModule])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这道错题吗？')) return

    try {
      const res = await fetch(`/api/wrong-questions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchQuestions()
      }
    } catch (error) {
      console.error('删除错题失败:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">还没有错题记录</h2>
        <p className="text-gray-500 mb-8">开始录入第一道错题，让每次错误都有价值</p>
        <Link
          href="/dashboard/wrong-questions/new"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          + 录入第一道错题
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">复盘记录</h1>
        <Link
          href="/dashboard/wrong-questions/new"
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          + 新建录入
        </Link>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">全部错误类型</option>
            {errorReasons.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>

          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">全部题型模块</option>
            {questionModules.map((module) => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>

          {(filterReason || filterModule) && (
            <button
              onClick={() => { setFilterReason(''); setFilterModule('') }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 错题列表 */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`bg-white rounded-xl shadow-sm p-6 transition-all hover:shadow-md ${
              q.isGuessed ? 'border-l-4 border-yellow-400' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{q.questionModule}</span>
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">{q.errorReason}</span>
                  {q.isGuessed && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">蒙对</span>
                  )}
                </div>
                <p className="text-gray-900 mb-2 line-clamp-2">{q.question}</p>
                <div className="text-sm text-gray-500">
                  <span className="text-red-500">我的答案：{q.myAnswer}</span>
                  <span className="mx-2">|</span>
                  <span className="text-green-600">正确答案：{q.correctAnswer}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/dashboard/wrong-questions/${q.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  详情
                </Link>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-sm text-gray-400 hover:text-danger"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (filterReason || filterModule) && (
        <div className="text-center py-12 text-gray-500">
          没有符合筛选条件的错题
        </div>
      )}
    </div>
  )
}