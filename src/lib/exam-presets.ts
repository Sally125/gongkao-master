export const examPresets = {
  '2026国考': {
    examName: '2026年国家公务员考试',
    nodes: {
      notice: '2025-10-14',
      registerStart: '2025-10-15',
      registerEnd: '2025-10-24',
      payDeadline: '2025-11-01',
      admissionTicket: '2025-11-25',
      writtenExam: '2025-11-30',
      interview: '2026-02-01',
      medicalExam: '2026-03-01',
    },
  },
  '2026省考联考': {
    examName: '2026年省考联考',
    nodes: {
      notice: '2026-01-15',
      registerStart: '2026-01-20',
      registerEnd: '2026-01-28',
      payDeadline: '2026-02-05',
      admissionTicket: '2026-03-10',
      writtenExam: '2026-03-15',
      interview: '2026-05-15',
      medicalExam: '2026-06-15',
    },
  },
} as const

export type ExamPresetKey = keyof typeof examPresets

export interface ExamNodes {
  notice: string
  registerStart: string
  registerEnd: string
  payDeadline: string
  admissionTicket: string
  writtenExam: string
  interview: string
  medicalExam: string
}

export const nodeLabels: Record<keyof ExamNodes, string> = {
  notice: '发布公告',
  registerStart: '报名开始',
  registerEnd: '报名截止',
  payDeadline: '缴费截止',
  admissionTicket: '打印准考证',
  writtenExam: '笔试',
  interview: '面试',
  medicalExam: '体检',
}