'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ToolType } from '@/types/markup'
import { getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import {
  MousePointer,
  Square,
  Type,
  Pencil,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

interface ToolPaletteProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  isMobile: boolean
  isLargeFont?: boolean
  touchMode?: string
}

export function ToolPalette({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
  isMobile,
  isLargeFont = false,
  touchMode = 'normal'
}: ToolPaletteProps) {
  const tools = [
    { id: 'select' as ToolType, icon: MousePointer, label: '선택', color: '' },
    { id: 'box-gray' as ToolType, icon: Square, label: '자재구간', color: 'text-gray-500' },
    { id: 'box-red' as ToolType, icon: Square, label: '작업진행', color: 'text-red-500' },
    { id: 'box-blue' as ToolType, icon: Square, label: '작업완료', color: 'text-blue-500' },
    { id: 'text' as ToolType, icon: Type, label: '텍스트', color: '' },
    { id: 'pen' as ToolType, icon: Pencil, label: '펜', color: 'text-red-500' },
  ]

  const actions = [
    { id: 'undo', icon: Undo2, label: '되돌리기', onClick: onUndo, disabled: !canUndo },
    { id: 'redo', icon: Redo2, label: '다시실행', onClick: onRedo, disabled: !canRedo },
    { id: 'delete', icon: Trash2, label: '삭제', onClick: onDelete, disabled: !hasSelection },
  ]

  const viewTools = [
    { id: 'zoom-in' as ToolType, icon: ZoomIn, label: '확대', color: '' },
    { id: 'zoom-out' as ToolType, icon: ZoomOut, label: '축소', color: '' },
  ]

  if (isMobile) {
    // 모바일 가로 레이아웃
    return (
      <div className={`flex items-center justify-between gap-2 px-3 ${
        touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1' : 'py-2'
      }`}>
        <div className="flex items-center gap-2">
          {tools.map(tool => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? 'primary' : 'ghost'}
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
              onClick={() => {
                console.log('Tool clicked:', tool.id, tool.label) // 디버깅용
                onToolChange(tool.id)
              }}
              className={cn(
                touchMode === 'glove' ? "min-w-[56px] min-h-[56px] p-4" :
                touchMode === 'precision' ? "min-w-[44px] min-h-[44px] p-2.5" :
                "min-w-[48px] min-h-[48px] p-3",
                "active:scale-95 transition-all duration-200 touch-manipulation",
                "focus-visible:ring-4 focus-visible:ring-blue-500/50",
                activeTool === tool.id && "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              )}
              title={tool.label}
            >
              <tool.icon className={cn("h-5 w-5", tool.color)} />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {actions.map(action => (
            <Button
              key={action.id}
              variant="ghost"
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
              onClick={() => {
                console.log('Action clicked:', action.id, action.label) // 디버깅용
                action.onClick()
              }}
              disabled={action.disabled}
              className={cn(
                touchMode === 'glove' ? "min-w-[56px] min-h-[56px] p-4" :
                touchMode === 'precision' ? "min-w-[44px] min-h-[44px] p-2.5" :
                "min-w-[48px] min-h-[48px] p-3",
                "active:scale-95 transition-all duration-200 touch-manipulation",
                "focus-visible:ring-4 focus-visible:ring-blue-500/50"
              )}
              title={action.label}
            >
              <action.icon className="h-5 w-5" />
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // 데스크톱 세로 레이아웃
  return (
    <div className="flex flex-col gap-2">
      {/* 도구 그룹 */}
      <div className="flex flex-col gap-1">
        {tools.map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'primary' : 'ghost'}
            size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
            onClick={() => {
              console.log('Tool clicked (desktop):', tool.id, tool.label) // 디버깅용
              onToolChange(tool.id)
            }}
            className={cn(
              "w-full flex flex-col items-center justify-center",
              touchMode === 'glove' ? "p-3 min-h-[64px]" :
              touchMode === 'precision' ? "p-1.5 min-h-[48px]" :
              "p-2 min-h-[56px]",
              "active:scale-95 transition-all duration-200 touch-manipulation",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50",
              activeTool === tool.id && "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
            )}
            title={tool.label}
          >
            <tool.icon className={cn("h-6 w-6 mb-1", tool.color)} />
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* 구분선 */}
      <div className="h-px bg-gray-200" />

      {/* 액션 그룹 */}
      <div className="flex flex-col gap-1">
        {actions.map(action => (
          <Button
            key={action.id}
            variant="ghost"
            size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
            onClick={() => {
              console.log('Action clicked (desktop):', action.id, action.label) // 디버깅용
              action.onClick()
            }}
            disabled={action.disabled}
            className={cn(
              "w-full flex flex-col items-center justify-center",
              touchMode === 'glove' ? "p-3 min-h-[64px]" :
              touchMode === 'precision' ? "p-1.5 min-h-[48px]" :
              "p-2 min-h-[56px]",
              "active:scale-95 transition-all duration-200 touch-manipulation",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50"
            )}
            title={action.label}
          >
            <action.icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* 구분선 */}
      <div className="h-px bg-gray-200" />

      {/* 뷰 도구 그룹 */}
      <div className="flex flex-col gap-1">
        {viewTools.map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'primary' : 'ghost'}
            size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
            onClick={() => {
              console.log('View tool clicked:', tool.id, tool.label) // 디버깅용
              onToolChange(tool.id)
            }}
            className={cn(
              "w-full flex flex-col items-center justify-center",
              touchMode === 'glove' ? "p-3 min-h-[64px]" :
              touchMode === 'precision' ? "p-1.5 min-h-[48px]" :
              "p-2 min-h-[56px]",
              "active:scale-95 transition-all duration-200 touch-manipulation",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50",
              activeTool === tool.id && "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
            )}
            title={tool.label}
          >
            <tool.icon className={cn("h-6 w-6 mb-1", tool.color)} />
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>{tool.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}