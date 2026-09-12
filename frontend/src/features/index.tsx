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
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// Panels are code-split so their chunks (and heavy deps like `openai`) only
// load once the panel is actually opened. Icons stay static below. Each lazy
// import maps the panel's named export to the `default` React.lazy expects.
const ChatPanel = lazy(() =>
  import('@/components/chat/chat-panel').then((m) => ({ default: m.ChatPanel })),
)
const DashboardPanel = lazy(() =>
  import('./dashboard/dashboard-panel').then((m) => ({ default: m.DashboardPanel })),
)
const DictionaryPanel = lazy(() =>
  import('./dictionary/dictionary-panel').then((m) => ({ default: m.DictionaryPanel })),
)
const BiblePanel = lazy(() =>
  import('./bible/bible-panel').then((m) => ({ default: m.BiblePanel })),
)
const MyanmarPanel = lazy(() =>
  import('./myanmar/myanmar-panel').then((m) => ({ default: m.MyanmarPanel })),
)
const GeminiPanel = lazy(() =>
  import('./gemini/gemini-panel').then((m) => ({ default: m.GeminiPanel })),
)
const TrainingPanel = lazy(() =>
  import('./training/training-panel').then((m) => ({ default: m.TrainingPanel })),
)
const QuizPanel = lazy(() => import('./quiz/quiz-panel').then((m) => ({ default: m.QuizPanel })))
const GrammarPanel = lazy(() =>
  import('./grammar/grammar-panel').then((m) => ({ default: m.GrammarPanel })),
)
const ZvsPanel = lazy(() => import('./zvs/zvs-panel').then((m) => ({ default: m.ZvsPanel })))
const ParagraphPanel = lazy(() =>
  import('./paragraph/paragraph-panel').then((m) => ({ default: m.ParagraphPanel })),
)
const ExportPanel = lazy(() =>
  import('./export/export-panel').then((m) => ({ default: m.ExportPanel })),
)
const AuditPanel = lazy(() =>
  import('./audit/audit-panel').then((m) => ({ default: m.AuditPanel })),
)
const MonitorPanel = lazy(() =>
  import('./monitor/monitor-panel').then((m) => ({ default: m.MonitorPanel })),
)
const DatabasePanel = lazy(() =>
  import('./database/database-panel').then((m) => ({ default: m.DatabasePanel })),
)

export interface PanelDefinition {
  id: string
  label: string
  section: string
  icon: LucideIcon
  component: LazyExoticComponent<ComponentType>
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