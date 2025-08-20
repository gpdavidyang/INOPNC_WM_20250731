'use client'

import { forwardRef, useEffect, useRef, useState, useCallback } from 'react'
import type { MarkupEditorState, MarkupObject, BoxMarkup, TextMarkup, DrawingMarkup } from '@/types/markup'
import { TextInputDialog } from '../dialogs/text-input-dialog'

interface MarkupCanvasProps {
  editorState: MarkupEditorState
  blueprintUrl?: string
  onStateChange: (updater: (prev: MarkupEditorState) => MarkupEditorState) => void
  containerRef: React.RefObject<HTMLDivElement>
}

export const MarkupCanvas = forwardRef<HTMLCanvasElement, MarkupCanvasProps>(
  ({ editorState, blueprintUrl, onStateChange, containerRef }, canvasRef) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null)
    const blueprintImageRef = useRef<HTMLImageElement | null>(null)
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
    const [currentDrawing, setCurrentDrawing] = useState<Partial<MarkupObject> | null>(null)
    const [textInputOpen, setTextInputOpen] = useState(false)
    const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 })
    
    // Canvas ref 처리
    const canvas = canvasRef && 'current' in canvasRef ? canvasRef.current : internalCanvasRef.current

    // 도면 이미지 로드 및 크기 조정
    useEffect(() => {
      if (blueprintUrl) {
        const img = new Image()
        img.onload = () => {
          blueprintImageRef.current = img
          
          // 이미지가 로드되면 화면에 맞게 초기 크기 조정
          if (canvas && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect()
            
            // 컨테이너 크기가 0이면 기본값 사용
            const containerWidth = containerRect.width || 800
            const containerHeight = containerRect.height || 400
            
            const imageAspectRatio = img.width / img.height
            const containerAspectRatio = containerWidth / containerHeight
            
            let scale = 1
            let fitWidth, fitHeight
            
            // 이미지를 컨테이너에 맞게 fit하는 스케일 계산
            if (imageAspectRatio > containerAspectRatio) {
              // 이미지가 더 넓음 - 너비 기준으로 맞춤
              scale = containerWidth / img.width
              fitWidth = containerWidth
              fitHeight = img.height * scale
            } else {
              // 이미지가 더 높음 - 높이 기준으로 맞춤
              scale = containerHeight / img.height
              fitWidth = img.width * scale
              fitHeight = containerHeight
            }
            
            // 이미지를 중앙에 위치시키기 위한 offset 계산
            const offsetX = (containerWidth - fitWidth) / 2
            const offsetY = (containerHeight - fitHeight) / 2
            
            // 초기 viewer state 설정
            onStateChange(prev => ({
              ...prev,
              viewerState: {
                ...prev.viewerState,
                zoom: scale,
                panX: offsetX,
                panY: offsetY,
                imageWidth: img.width,
                imageHeight: img.height
              }
            }))
          }
        }
        img.src = blueprintUrl
      }
    }, [blueprintUrl, canvas, containerRef, onStateChange])

    // 캔버스 크기 조정
    useEffect(() => {
      const resizeCanvas = () => {
        if (canvas && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          
          // 최소 높이 설정 (높이가 0이면 400px로 설정)
          const width = rect.width || 800
          const height = rect.height || 400
          
          console.log('Resizing canvas:', { // 디버깅용
            originalWidth: rect.width,
            originalHeight: rect.height,
            usedWidth: width,
            usedHeight: height,
            canvasExists: !!canvas
          })
          
          canvas.width = width
          canvas.height = height
          
          // 리사이즈 시 이미지도 다시 fit
          if (blueprintImageRef.current) {
            const img = blueprintImageRef.current
            const imageAspectRatio = img.width / img.height
            const containerAspectRatio = width / height
            
            let scale = 1
            let fitWidth, fitHeight
            
            if (imageAspectRatio > containerAspectRatio) {
              scale = width / img.width
              fitWidth = width
              fitHeight = img.height * scale
            } else {
              scale = height / img.height
              fitWidth = img.width * scale
              fitHeight = height
            }
            
            const offsetX = (width - fitWidth) / 2
            const offsetY = (height - fitHeight) / 2
            
            onStateChange(prev => ({
              ...prev,
              viewerState: {
                ...prev.viewerState,
                zoom: scale,
                panX: offsetX,
                panY: offsetY,
                imageWidth: img.width,
                imageHeight: img.height
              }
            }))
          }
          
          redrawCanvas()
        }
      }

      resizeCanvas()
      
      // DOM이 완전히 렌더링된 후 다시 한번 리사이즈
      const timeoutId = setTimeout(resizeCanvas, 100)
      
      window.addEventListener('resize', resizeCanvas)
      return () => {
        window.removeEventListener('resize', resizeCanvas)
        clearTimeout(timeoutId)
      }
    }, [canvas, containerRef, onStateChange])

    // 캔버스 좌표 변환
    const getCanvasCoordinates = useCallback((e: React.MouseEvent | MouseEvent) => {
      if (!canvas) return { x: 0, y: 0 }
      
      const rect = canvas.getBoundingClientRect()
      const { zoom, panX, panY } = editorState.viewerState
      
      // 마우스 위치를 이미지 좌표계로 변환
      const x = (e.clientX - rect.left - panX) / zoom
      const y = (e.clientY - rect.top - panY) / zoom
      
      console.log('🔥 Coordinate transform:', {
        mouse: { clientX: e.clientX, clientY: e.clientY },
        rect: { left: rect.left, top: rect.top },
        viewer: { zoom, panX, panY },
        result: { x, y }
      }) // 디버깅용
      
      return { x, y }
    }, [canvas, editorState.viewerState])

    // 캔버스 다시 그리기
    const redrawCanvas = useCallback(() => {
      if (!canvas) {
        console.log('Canvas not available') // 디버깅용
        return
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.log('Canvas context not available') // 디버깅용
        return
      }

      const { zoom, panX, panY } = editorState.viewerState
      
      console.log('Redrawing canvas:', { // 디버깅용
        zoom, panX, panY,
        markupObjects: editorState.markupObjects.length,
        currentDrawing: !!currentDrawing,
        canvasSize: { width: canvas.width, height: canvas.height }
      })

      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 변환 적용
      ctx.save()
      ctx.translate(panX, panY)
      ctx.scale(zoom, zoom)

      // 도면 이미지 그리기
      if (blueprintImageRef.current) {
        ctx.drawImage(blueprintImageRef.current, 0, 0)
        console.log('Blueprint drawn') // 디버깅용
      }

      // 마킹 객체들 그리기
      editorState.markupObjects.forEach((obj, index) => {
        console.log(`Drawing markup object ${index}:`, obj) // 디버깅용
        drawMarkupObject(ctx, obj, editorState.selectedObjects.includes(obj.id))
      })

      // 현재 그리고 있는 객체 그리기
      if (currentDrawing) {
        console.log('Drawing current object:', currentDrawing) // 디버깅용
        drawMarkupObject(ctx, currentDrawing as MarkupObject, false)
      }

      ctx.restore()
    }, [canvas, editorState, currentDrawing])

    // 도면 이미지가 로드되었을 때 redraw
    useEffect(() => {
      if (blueprintImageRef.current) {
        console.log('Blueprint image loaded, redrawing canvas')
        redrawCanvas()
      }
    }, [blueprintUrl, redrawCanvas])

    // 마킹 객체 그리기
    const drawMarkupObject = (ctx: CanvasRenderingContext2D, obj: Partial<MarkupObject>, isSelected: boolean) => {
      ctx.save()

      if (obj.type === 'box') {
        const box = obj as BoxMarkup
        ctx.fillStyle = box.color === 'gray' ? '#9CA3AF' : 
                        box.color === 'red' ? '#EF4444' : '#3B82F6'
        ctx.globalAlpha = 0.5
        ctx.fillRect(box.x || 0, box.y || 0, box.width || 0, box.height || 0)
        
        if (isSelected) {
          ctx.strokeStyle = '#1F2937'
          ctx.lineWidth = 2
          ctx.globalAlpha = 1
          ctx.strokeRect(box.x || 0, box.y || 0, box.width || 0, box.height || 0)
        }
      } else if (obj.type === 'text') {
        const text = obj as TextMarkup
        ctx.font = `${text.fontSize}px sans-serif`
        ctx.fillStyle = text.fontColor
        ctx.globalAlpha = 1
        ctx.fillText(text.content, text.x || 0, text.y || 0)
        
        if (isSelected) {
          const metrics = ctx.measureText(text.content)
          ctx.strokeStyle = '#1F2937'
          ctx.lineWidth = 1
          ctx.strokeRect(
            (text.x || 0) - 2, 
            (text.y || 0) - text.fontSize, 
            metrics.width + 4, 
            text.fontSize + 4
          )
        }
      } else if (obj.type === 'drawing') {
        const drawing = obj as DrawingMarkup
        if (drawing.path.length > 0) {
          ctx.strokeStyle = drawing.strokeColor
          ctx.lineWidth = drawing.strokeWidth
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.moveTo(drawing.path[0].x, drawing.path[0].y)
          drawing.path.forEach(point => {
            ctx.lineTo(point.x, point.y)
          })
          ctx.stroke()
        }
      }

      ctx.restore()
    }

    // 마우스 이벤트 핸들러
    const handleMouseDown = (e: React.MouseEvent) => {
      console.log('🔥 handleMouseDown called!', { 
        clientX: e.clientX, 
        clientY: e.clientY,
        target: e.target,
        currentTarget: e.currentTarget
      })
      
      const { activeTool } = editorState.toolState
      const coords = getCanvasCoordinates(e)
      
      console.log('Mouse down:', { activeTool, coords }) // 디버깅용
      
      // Text tool - open dialog on single click
      if (activeTool === 'text') {
        console.log('🔥 Text tool click - opening dialog')
        setTextInputPosition(coords)
        setTextInputOpen(true)
        return
      }
      
      setIsMouseDown(true)
      setStartPoint(coords)

      if (activeTool === 'select') {
        // 선택 도구 로직
        const clickedObject = findObjectAtPoint(coords)
        if (clickedObject) {
          onStateChange(prev => ({
            ...prev,
            selectedObjects: [clickedObject.id]
          }))
        } else {
          onStateChange(prev => ({
            ...prev,
            selectedObjects: []
          }))
        }
      } else if (activeTool.startsWith('box-')) {
        // 박스 도구 시작
        const color = activeTool.split('-')[1] as 'gray' | 'red' | 'blue'
        const label = color === 'gray' ? '자재구간' : 
                     color === 'red' ? '작업진행' : '작업완료'
        
        console.log('🔥 Starting box drawing:', { activeTool, color, label }) // 디버깅용
        
        setCurrentDrawing({
          id: `temp-${Date.now()}`,
          type: 'box',
          x: coords.x,
          y: coords.y,
          width: 0,
          height: 0,
          color,
          label,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        } as BoxMarkup)
      } else if (activeTool === 'pen') {
        // 펜 도구 시작
        console.log('🔥 Starting pen drawing:', { activeTool }) // 디버깅용
        
        setCurrentDrawing({
          id: `temp-${Date.now()}`,
          type: 'drawing',
          x: coords.x,
          y: coords.y,
          path: [coords],
          strokeColor: '#EF4444',
          strokeWidth: 2,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        } as DrawingMarkup)
      }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isMouseDown) return
      
      const coords = getCanvasCoordinates(e)
      const { activeTool } = editorState.toolState

      console.log('🔥 Mouse move:', { activeTool, coords, currentDrawing: !!currentDrawing }) // 디버깅용

      if (currentDrawing) {
        if (currentDrawing.type === 'box') {
          const newWidth = coords.x - startPoint.x
          const newHeight = coords.y - startPoint.y
          console.log('🔥 Updating box:', { startPoint, coords, newWidth, newHeight }) // 디버깅용
          
          setCurrentDrawing(prev => ({
            ...prev,
            width: newWidth,
            height: newHeight
          }))
        } else if (currentDrawing.type === 'drawing') {
          console.log('🔥 Adding path point:', coords) // 디버깅용
          setCurrentDrawing(prev => ({
            ...prev,
            path: [...(prev as DrawingMarkup).path, coords]
          }))
        }
      }
    }

    const handleMouseUp = () => {
      console.log('🔥 Mouse up, currentDrawing:', currentDrawing) // 디버깅용
      
      if (currentDrawing) {
        // 현재 그리기를 완료하고 저장
        const newObject = {
          ...currentDrawing,
          id: `markup-${Date.now()}`
        } as MarkupObject

        console.log('🔥 Saving new markup object:', newObject) // 디버깅용

        onStateChange(prev => ({
          ...prev,
          markupObjects: [...prev.markupObjects, newObject],
          undoStack: [...prev.undoStack, prev.markupObjects],
          redoStack: []
        }))

        setCurrentDrawing(null)
      }
      
      setIsMouseDown(false)
    }

    // 더블클릭으로 텍스트 추가
    const handleDoubleClick = (e: React.MouseEvent) => {
      console.log('🔥 Double click detected!', { 
        activeTool: editorState.toolState.activeTool,
        clientX: e.clientX,
        clientY: e.clientY
      })
      
      if (editorState.toolState.activeTool === 'text') {
        const coords = getCanvasCoordinates(e)
        console.log('🔥 Opening text input dialog at:', coords)
        setTextInputPosition(coords)
        setTextInputOpen(true)
      }
    }

    // 텍스트 입력 확인 핸들러
    const handleTextConfirm = (text: string) => {
      console.log('🔥 handleTextConfirm called with text:', text)
      console.log('🔥 Text position:', textInputPosition)
      
      const newText: TextMarkup = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: textInputPosition.x,
        y: textInputPosition.y,
        content: text,
        fontSize: 16,
        fontColor: '#000000',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }

      console.log('🔥 Creating new text object:', newText)

      onStateChange(prev => ({
        ...prev,
        markupObjects: [...prev.markupObjects, newText],
        undoStack: [...prev.undoStack, prev.markupObjects],
        redoStack: []
      }))
      
      console.log('🔥 Text added to canvas')
    }

    // 마우스 휠 줌 기능
    const handleWheel = useCallback((e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const rect = canvas?.getBoundingClientRect()
        if (!rect) return
        
        const { zoom, panX, panY } = editorState.viewerState
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
        
        // 마우스 위치를 중심으로 줌
        const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom)
        const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom)
        
        onStateChange(prev => ({
          ...prev,
          viewerState: {
            ...prev.viewerState,
            zoom: newZoom,
            panX: newPanX,
            panY: newPanY
          }
        }))
      }
    }, [canvas, editorState.viewerState, onStateChange])

    // 점에서 객체 찾기
    const findObjectAtPoint = (point: { x: number, y: number }): MarkupObject | null => {
      for (let i = editorState.markupObjects.length - 1; i >= 0; i--) {
        const obj = editorState.markupObjects[i]
        
        if (obj.type === 'box') {
          const box = obj as BoxMarkup
          if (point.x >= box.x && point.x <= box.x + box.width &&
              point.y >= box.y && point.y <= box.y + box.height) {
            return obj
          }
        }
        // TODO: 텍스트와 드로잉 객체 히트 테스트 구현
      }
      
      return null
    }

    // 마크업 객체 또는 뷰어 상태가 변경될 때마다 다시 그리기
    useEffect(() => {
      console.log('State changed, triggering redraw') // 디버깅용
      redrawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorState.markupObjects, editorState.viewerState, editorState.selectedObjects, currentDrawing])

    // currentDrawing 상태 변경 감지
    useEffect(() => {
      console.log('Current drawing changed:', currentDrawing) // 디버깅용
    }, [currentDrawing])

    // 캔버스 요소 상태 디버깅
    useEffect(() => {
      console.log('Canvas element debug:', {
        canvas: !!canvas,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        canvasStyle: canvas?.style.cssText,
        containerExists: !!containerRef.current,
        containerRect: containerRef.current?.getBoundingClientRect(),
        activeTool: editorState.toolState.activeTool
      })
    }, [canvas, containerRef, editorState.toolState.activeTool])

    return (
      <>
        <canvas
          ref={canvasRef || internalCanvasRef}
          className={`w-full h-full ${
            editorState.toolState.activeTool === 'text' ? 'cursor-text' : 
            editorState.toolState.activeTool === 'select' ? 'cursor-pointer' :
            'cursor-crosshair'
          }`}
          onPointerDown={(e) => {
            console.log('🔥 Pointer down:', e.clientX, e.clientY)
            // Convert pointer event to mouse event for consistency
            const mouseEvent = {
              clientX: e.clientX,
              clientY: e.clientY,
              target: e.target,
              currentTarget: e.currentTarget,
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation()
            } as any
            handleMouseDown(mouseEvent)
          }}
          onPointerMove={(e) => {
            console.log('🔥 Pointer move:', e.clientX, e.clientY)
            if (!isMouseDown) return
            const mouseEvent = {
              clientX: e.clientX,
              clientY: e.clientY,
              target: e.target,
              currentTarget: e.currentTarget,
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation()
            } as any
            handleMouseMove(mouseEvent)
          }}
          onPointerUp={(e) => {
            console.log('🔥 Pointer up:', e.clientX, e.clientY)
            handleMouseUp()
          }}
          onPointerLeave={(e) => {
            console.log('🔥 Pointer leave')
            handleMouseUp()
          }}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onClick={(e) => {
            console.log('🔥 Canvas clicked:', e.clientX, e.clientY)
          }}
          style={{
            display: 'block',
            touchAction: 'none',
            pointerEvents: 'auto'
          }}
        />
        
        {/* Text Input Dialog */}
        <TextInputDialog
          open={textInputOpen}
          onClose={() => setTextInputOpen(false)}
          onConfirm={handleTextConfirm}
          position={textInputPosition}
        />
      </>
    )
  }
)

MarkupCanvas.displayName = 'MarkupCanvas'