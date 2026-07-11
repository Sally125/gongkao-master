'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'

interface Task {
  id: string
  title: string
  priority: '高' | '中' | '低'
  estimatedMinutes: number
  deadline: string | null
  subjectTag: string | null
  status: 'todo' | 'doing' | 'done'
  source: string
  sortOrder: number
  imageUrl: string | null
  startedAt: string | null
  pausedAt: string | null
  totalPausedSeconds: number
  actualSeconds: number | null
  completedAt: string | null
  enteredAt: string
  createdAt: string
}

const priorityColors = {
  '高': 'bg-red-100 text-red-700',
  '中': 'bg-yellow-100 text-yellow-700',
  '低': 'bg-green-100 text-green-700',
}

const statusLabels = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
}

const subjectOptions: Record<string, string[]> = {
  '行测': ['数量关系', '资料分析', '推理判断', '言语分析'],
  '申论': ['归纳概括', '提出对策', '综合分析', '贯彻执行', '申发论述'],
  '其他': [],
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getElapsedSeconds(task: Task, now: number): number {
  if (!task.startedAt) return 0
  const started = new Date(task.startedAt).getTime()
  const total = Math.floor((now - started) / 1000) - task.totalPausedSeconds
  if (task.pausedAt) {
    return total - Math.floor((now - new Date(task.pausedAt).getTime()) / 1000)
  }
  return total
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0秒'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}小时${m > 0 ? m + '分钟' : ''}`
  if (m > 0) return `${m}分钟${s > 0 ? s + '秒' : ''}`
  return `${s}秒`
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}分钟`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

function DoingTaskCard({ task, onAction }: { task: Task; onAction: (id: string, action: string, extra?: { actualSeconds?: number }) => void }) {
  const [now, setNow] = useState(Date.now())
  const autoCompletedRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const elapsed = getElapsedSeconds(task, now)
  const remaining = task.estimatedMinutes * 60 - elapsed
  const isPaused = !!task.pausedAt

  useEffect(() => {
    if (remaining <= 0 && !isPaused && !autoCompletedRef.current) {
      autoCompletedRef.current = true
      onAction(task.id, 'done', { actualSeconds: elapsed })
    }
  }, [remaining, isPaused, elapsed, task.id, onAction])

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 transition-transform hover:scale-[1.02] active:scale-[0.98] ${isPaused ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.subjectTag && (
        <div className="text-xs text-gray-500 mb-2">📚 {task.subjectTag}</div>
      )}

      <div className="text-center my-3">
        <div className={`text-3xl font-mono font-bold ${remaining <= 0 ? 'text-red-600' : 'text-primary'}`}>
          {formatCountdown(remaining)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {isPaused ? '已暂停' : '剩余时间'}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {isPaused ? (
          <button
            onClick={() => onAction(task.id, 'resume')}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
          >
            继续
          </button>
        ) : (
          <button
            onClick={() => onAction(task.id, 'pause')}
            className="text-xs bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
          >
            暂停
          </button>
        )}
        <button
          onClick={() => onAction(task.id, 'done', { actualSeconds: elapsed })}
          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
        >
          完成
        </button>
        <button
          onClick={() => onAction(task.id, 'delete')}
          className="text-xs text-danger hover:underline ml-auto"
        >
          删除
        </button>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'高' | '中' | '低'>('中')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [deadline, setDeadline] = useState('')
  const [subjectCategory, setSubjectCategory] = useState('')
  const [subjectSub, setSubjectSub] = useState('')
  const [customTag, setCustomTag] = useState('')

  const getSubjectTag = () => {
    if (subjectCategory === '其他') return customTag
    if (subjectCategory && subjectSub) return `${subjectCategory}-${subjectSub}`
    return ''
  }

  const parseSubjectTag = (tag: string) => {
    if (!tag) { setSubjectCategory(''); setSubjectSub(''); setCustomTag(''); return }
    const parts = tag.split('-')
    if (parts.length === 2 && subjectOptions[parts[0]]) {
      setSubjectCategory(parts[0])
      setSubjectSub(parts[1])
    } else {
      setSubjectCategory('其他')
      setCustomTag(tag)
    }
  }

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('获取任务失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const resetForm = () => {
    setTitle('')
    setPriority('中')
    setEstimatedMinutes(30)
    setDeadline('')
    setSubjectCategory('')
    setSubjectSub('')
    setCustomTag('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tag = getSubjectTag()

    try {
      if (editingId) {
        const res = await fetch(`/api/tasks/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, priority, estimatedMinutes, deadline: deadline || null, subjectTag: tag || null }),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, priority, estimatedMinutes, deadline: deadline || null, subjectTag: tag || null }),
        })
        if (!res.ok) throw new Error('创建失败')
      }

      resetForm()
      fetchTasks()
    } catch (error) {
      console.error('保存任务失败:', error)
    }
  }

  const handleEdit = (task: Task) => {
    if (task.status === 'done') return
    setTitle(task.title)
    setPriority(task.priority as '高' | '中' | '低')
    setEstimatedMinutes(task.estimatedMinutes)
    setDeadline(task.deadline || '')
    parseSubjectTag(task.subjectTag || '')
    setEditingId(task.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个任务吗？')) return
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      fetchTasks()
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  const handleStartTask = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })
      fetchTasks()
    } catch (error) {
      console.error('开始任务失败:', error)
    }
  }

  const handleTaskAction = async (id: string, action: string, extra?: { actualSeconds?: number }) => {
    try {
      if (action === 'delete') {
        if (!confirm('确定要删除这个任务吗？')) return
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...extra }),
        })
      }
      fetchTasks()
    } catch (error) {
      console.error('任务操作失败:', error)
    }
  }

  const handleRedo = async (task: Task) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          deadline: today,
          subjectTag: task.subjectTag,
          status: 'todo',
        }),
      })
      if (!res.ok) throw new Error('创建失败')
      fetchTasks()
    } catch (error) {
      console.error('再学一次失败:', error)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const newStatus = destination.droppableId as Task['status']
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTasks()
    } catch (error) {
      console.error('更新任务状态失败:', error)
    }
  }

  const getTasksByStatus = (status: Task['status']) =>
    tasks.filter((t) => t.status === status).sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())

  if (loading) return <div className="text-center py-12 text-gray-500">加载中...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">智能Todo</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          {showForm ? '取消' : '+ 添加任务'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? '编辑任务' : '添加任务'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" placeholder="任务标题" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as '高' | '中' | '低')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预计时长（分钟）</label>
              <input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">科目标签</label>
              <select value={subjectCategory} onChange={(e) => { setSubjectCategory(e.target.value); setSubjectSub('') }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                <option value="">请选择科目</option>
                {Object.keys(subjectOptions).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {subjectCategory && subjectCategory !== '其他' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模块</label>
                <select value={subjectSub} onChange={(e) => setSubjectSub(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                  <option value="">请选择模块</option>
                  {subjectOptions[subjectCategory]?.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {subjectCategory === '其他' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自定义标签</label>
                <input type="text" value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" placeholder="输入标签名称" />
              </div>
            )}
          </div>

          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            {editingId ? '保存修改' : '添加'}
          </button>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['todo', 'doing', 'done'] as const).map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div className={`bg-gray-50 rounded-xl p-4 min-h-[400px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50' : ''}`}
                  ref={provided.innerRef} {...provided.droppableProps}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {statusLabels[status]}
                    <span className="text-sm font-normal text-gray-500">({getTasksByStatus(status).length})</span>
                  </h3>

                  <div className="space-y-3">
                    {getTasksByStatus(status).map((task, index) => {
                      if (status === 'doing') {
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                className={`transition-all duration-300 ease-out ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}`}>
                                <DoingTaskCard task={task} onAction={handleTaskAction} />
                              </div>
                            )}
                          </Draggable>
                        )
                      }

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`transition-all duration-300 ease-out ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}`}>
                              <div className={`bg-white rounded-lg shadow-sm p-4 transition-transform hover:scale-[1.02] active:scale-[0.98] ${status === 'done' ? 'opacity-80' : ''}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className={`font-medium flex-1 ${status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                                  <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>{task.priority}</span>
                                </div>

                                {task.subjectTag && <div className="text-xs text-gray-500 mb-2">📚 {task.subjectTag}</div>}

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  {task.status === 'done' && task.actualSeconds != null
                                    ? <span>⏱ 实际用时 {formatDuration(task.actualSeconds)}</span>
                                    : <span>⏱ {task.estimatedMinutes}分钟</span>}
                                  {task.deadline && <span>📅 {task.deadline}</span>}
                                </div>

                                {task.status === 'done' && task.actualSeconds != null && task.startedAt && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(task.startedAt).toLocaleDateString('zh-CN')} 开始 → {task.completedAt ? new Date(task.completedAt).toLocaleDateString('zh-CN') : '进行中'} 结束
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2">
                                    {task.status === 'todo' && (
                                      <button onClick={() => handleStartTask(task.id)}
                                        className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors">开始任务</button>
                                    )}
                                    {task.status === 'done' && (
                                      <button onClick={() => handleRedo(task)}
                                        className="text-xs bg-accent text-white px-3 py-1 rounded hover:bg-accent-600 transition-colors">再学一次</button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {task.status !== 'done' && (
                                      <button onClick={() => handleEdit(task)} className="text-xs text-primary hover:underline">编辑</button>
                                    )}
                                    <button onClick={() => handleDelete(task.id)} className="text-xs text-danger hover:underline">删除</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}