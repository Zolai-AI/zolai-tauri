import {
  Activity,
  AlignLeft,
  BookOpen,
  Database,
  Download,
  GraduationCap,
  HelpCircle,
  History,
  Languages,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  SpellCheck,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'

import { ChatPanel } from '@/components/chat/chat-panel'
import { DashboardPanel } from '@/features/dashboard/dashboard-panel'
import { DictionaryPanel } from '@/features/dictionary/dictionary-panel'
import { BiblePanel } from '@/features/bible/bible-panel'
import { MyanmarPanel } from '@/features/myanmar/myanmar-panel'
import { GeminiPanel } from '@/features/gemini/gemini-panel'
import { TrainingPanel } from '@/features/training/training-panel'
import { QuizPanel } from '@/features/quiz/quiz-panel'
import { GrammarPanel } from '@/features/grammar/grammar-panel'
import { ZvsPanel } from '@/features/zvs/zvs-panel'
import { ParagraphPanel } from '@/features/paragraph/paragraph-panel'
import { ExportPanel } from '@/features/export/export-panel'
import { AuditPanel } from '@/features/audit/audit-panel'
import { MonitorPanel } from '@/features/monitor/monitor-panel'
import { DatabasePanel } from '@/features/database/database-panel'
import type { ComponentType } from 'react'

export interface PanelDefinition {
  id: string
  label: string
  section: string
  icon: LucideIcon
  component: ComponentType
}

export const PANELS: readonly PanelDefinition[] = [
  { id: 'chat', label: 'Chat', section: 'Workspace', icon: MessageSquare, component: ChatPanel },
  { id: 'dashboard', label: 'Dashboard', section: 'Workspace', icon: LayoutDashboard, component: DashboardPanel },
  { id: 'dictionary', label: 'Dictionary', section: 'Data', icon: BookOpen, component: DictionaryPanel },
  { id: 'bible', label: 'Bible', section: 'Data', icon: ScrollText, component: BiblePanel },
  { id: 'myanmar', label: 'Myanmar', section: 'Data', icon: Languages, component: MyanmarPanel },
  { id: 'gemini', label: 'Gemini', section: 'Tools', icon: Sparkles, component: GeminiPanel },
  { id: 'training', label: 'Training', section: 'Tools', icon: GraduationCap, component: TrainingPanel },
  { id: 'quiz', label: 'Quiz', section: 'Tools', icon: HelpCircle, component: QuizPanel },
  { id: 'grammar', label: 'Grammar', section: 'Tools', icon: SpellCheck, component: GrammarPanel },
  { id: 'zvs', label: 'ZVS 2018', section: 'Tools', icon: ShieldCheck, component: ZvsPanel },
  { id: 'paragraph', label: 'Paragraph', section: 'Tools', icon: AlignLeft, component: ParagraphPanel },
  { id: 'export', label: 'Export', section: 'Tools', icon: Download, component: ExportPanel },
  { id: 'audit', label: 'Audit', section: 'System', icon: History, component: AuditPanel },
  { id: 'monitor', label: 'Monitor', section: 'System', icon: Activity, component: MonitorPanel },
  { id: 'database', label: 'Database', section: 'System', icon: Database, component: DatabasePanel },
] as const

export function getPanel(id: string): PanelDefinition | undefined {
  return PANELS.find((p) => p.id === id)
}