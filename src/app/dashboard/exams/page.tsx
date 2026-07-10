'use client'

import { useState, useEffect } from 'react'
import { examPresets, nodeLabels, type ExamNodes, type ExamPresetKey } from '@/lib/exam-presets'

interface Exam {
  id: string
  examName: string
  nodes: ExamNodes
  isEnabled: boolean
  createdAt: string
}

const emptyNodes: ExamNodes = {
  notice: '',
  registerStart: '',
  registerEnd: '',
  payDeadline: '',
  admissionTicket: '',
  writtenExam: '',
  interview: '',
  medicalExam: '',
}

function isExamExpired(exam: Exam): boolean {
  const nodes = exam.nodes as unknown as Record<string, string>
  const today = new Date().toISOString().split('T')[0]
  const filledNodes = Object.values(nodes).filter((v) => v && v.length > 0)
  if (filledNodes.length === 0) return false
  return filledNodes.every((date) => date <= today)
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [examName, setExamName] = useState('')
  const [nodes, setNodes] = useState<ExamNodes>(emptyNodes)
  const [isEnabled, setIsEnabled] = useState(true)

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      if (res.ok) {
        const data = await res.json()
        setExams(data.exams)
      }
    } catch (error) {
      console.error('获取考试列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  const handlePresetSelect = (key: ExamPresetKey) => {
    const preset = examPresets[key]
    setExamName(preset.examName)
    setNodes(preset.nodes as unknown as ExamNodes)
  }

  const resetForm = () => {
    setExamName('')
    setNodes(emptyNodes)
    setIsEnabled(true)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        const res = await fetch(`/api/exams/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examName, nodes, isEnabled }),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examName, nodes, isEnabled }),
        })
        if (!res.ok) throw new Error('创建失败')
      }

      resetForm()
      fetchExams()
    } catch (error) {
      console.error('保存考试失败:', error)
    }
  }

  const handleEdit = (exam: Exam) => {
    setExamName(exam.examName)
    setNodes(exam.nodes as unknown as ExamNodes)
    setIsEnabled(exam.isEnabled)
    setEditingId(exam.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个考试吗？')) return

    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      fetchExams()
    } catch (error) {
      console.error('删除考试失败:', error)
    }
  }

  const handleToggleEnabled = async (exam: Exam) => {
    try {
      await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !exam.isEnabled }),
      })
      fetchExams()
    } catch (error) {
      console.error('切换状态失败:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {showForm ? '取消' : '+ 添加考试'}
        </button>
      </div>

      {/* 表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? '编辑考试' : '添加考试'}
          </h2>

          {/* 预设选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              从预设快速填充
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(examPresets).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetSelect(key as ExamPresetKey)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-primary-50 hover:text-primary transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* 考试名称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              考试名称 *
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="如：2026年国家公务员考试"
            />
          </div>

          {/* 节点日期 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {(Object.keys(nodeLabels) as Array<keyof ExamNodes>).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {nodeLabels[key]}
                </label>
                <input
                  type="date"
                  value={nodes[key]}
                  onChange={(e) => setNodes({ ...nodes, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
            ))}
          </div>

          {/* 启用状态 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">启用倒计时</span>
            </label>
          </div>

          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {editingId ? '保存修改' : '添加'}
          </button>
        </form>
      )}

      {/* 考试列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <span className="text-4xl mb-4 block">📋</span>
          <p className="text-gray-500">还没有添加考试，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const expired = isExamExpired(exam)
            return (
              <div
                key={exam.id}
                className={`bg-white rounded-xl shadow-sm p-6 ${
                  !exam.isEnabled ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{exam.examName}</h3>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        expired
                          ? 'bg-red-100 text-red-700'
                          : exam.isEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {expired ? '已过期' : exam.isEnabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEnabled(exam)}
                      className={`text-sm hover:underline ${
                        exam.isEnabled ? 'text-gray-500 hover:text-primary' : 'text-primary'
                      }`}
                    >
                      {exam.isEnabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleEdit(exam)}
                      className="text-sm text-primary hover:underline"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-sm text-danger hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(nodeLabels) as Array<keyof ExamNodes>).map((key) => {
                    const value = (exam.nodes as unknown as Record<string, string>)[key]
                    if (!value) return null
                    return (
                      <div key={key} className="text-sm">
                        <span className="text-gray-500">{nodeLabels[key]}：</span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}