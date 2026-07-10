'use client'

import { useState, useEffect } from 'react'

interface ExamNodes {
  notice: string
  registerStart: string
  registerEnd: string
  payDeadline: string
  admissionTicket: string
  writtenExam: string
  interview: string
  medicalExam: string
}

interface Exam {
  id: string
  examName: string
  nodes: ExamNodes
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calcTimeLeft(targetDate: string): TimeLeft | null {
  const target = new Date(targetDate + 'T09:00:00').getTime()
  const now = Date.now()
  const diff = target - now

  if (diff <= 0) return null

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  }
}

export default function CountdownBanner() {
  const [exam, setExam] = useState<Exam | null>(null)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExam() {
      try {
        const res = await fetch('/api/exams/next')
        if (res.ok) {
          const data = await res.json()
          if (data.exam) {
            setExam(data.exam)
            setTimeLeft(calcTimeLeft(data.exam.nodes.writtenExam))
          }
        }
      } catch (error) {
        console.error('获取考试信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [])

  useEffect(() => {
    if (!exam?.nodes?.writtenExam) return

    const timer = setInterval(() => {
      const tl = calcTimeLeft(exam.nodes.writtenExam)
      setTimeLeft(tl)
    }, 1000)

    return () => clearInterval(timer)
  }, [exam])

  if (loading) return null
  if (!exam) return null

  return (
    <div className="bg-gradient-to-r from-primary to-primary-700 rounded-xl p-4 mb-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm opacity-80">距离考试</p>
          <h2 className="text-lg font-bold">{exam.examName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {timeLeft ? (
            <>
              <div className="text-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{timeLeft.days}</div>
                <div className="text-xs opacity-80">天</div>
              </div>
              <div className="text-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-xs opacity-80">时</div>
              </div>
              <div className="text-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-xs opacity-80">分</div>
              </div>
              <div className="text-center bg-white/20 rounded-lg px-3 py-2 min-w-[60px]">
                <div className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-xs opacity-80">秒</div>
              </div>
            </>
          ) : (
            <div className="text-xl font-bold bg-white/20 rounded-lg px-4 py-2">
              🎯 笔试进行中
            </div>
          )}
        </div>
      </div>
    </div>
  )
}