/**
 * INOPNC 디자인 시스템 유틸리티 함수
 * 컴포넌트에서 쉽게 사용할 수 있는 헬퍼 함수들
 */

import { cn } from '@/lib/utils'

// ============================================================================
// 카드 시스템 유틸리티
// ============================================================================

export interface CardConfig {
  variant?: 'default' | 'elevated' | 'prominent' | 'section-header'
  elevation?: 'sm' | 'md' | 'lg' | 'xl'
  padding?: 'normal' | 'glove' | 'precision'
  className?: string
}

export const getCardClasses = (config: CardConfig = {}) => {
  const {
    variant = 'default',
    elevation = 'sm',
    padding = 'normal',
    className
  } = config

  return cn(
    'card',
    {
      'card-elevated': variant === 'elevated',
      'card-prominent': variant === 'prominent',
      'card-section-header': variant === 'section-header',
      'card-elevation-sm': elevation === 'sm',
      'card-elevation-md': elevation === 'md',
      'card-elevation-lg': elevation === 'lg',
      'card-elevation-xl': elevation === 'xl',
      'card-padding-normal': padding === 'normal',
      'card-padding-glove': padding === 'glove',
      'card-padding-precision': padding === 'precision'
    },
    className
  )
}

// ============================================================================
// 버튼 시스템 유틸리티
// ============================================================================

export interface ButtonConfig {
  variant?: 'primary' | 'secondary' | 'main' | 'muted'
  size?: 'compact' | 'standard' | 'field' | 'critical' | 'full'
  touchMode?: 'normal' | 'glove' | 'precision'
  className?: string
}

export const getButtonClasses = (config: ButtonConfig = {}) => {
  const {
    variant = 'primary',
    size = 'standard',
    touchMode = 'normal',
    className
  } = config

  return cn(
    'btn',
    {
      'btn-primary': variant === 'primary',
      'btn-secondary': variant === 'secondary',
      'btn-main': variant === 'main',
      'btn-muted': variant === 'muted',
      'btn-size-compact': size === 'compact',
      'btn-size-standard': size === 'standard',
      'btn-size-field': size === 'field',
      'btn-size-critical': size === 'critical',
      'btn-size-full': size === 'full',
      'btn-touch-glove': touchMode === 'glove',
      'btn-touch-precision': touchMode === 'precision'
    },
    className
  )
}

// ============================================================================
// 칩 시스템 유틸리티
// ============================================================================

export type ChipVariant = 'a' | 'b' | 'd' | 'e'

export const getChipClasses = (variant: ChipVariant, className?: string) => {
  return cn(
    'chip',
    {
      'chip-a': variant === 'a',
      'chip-b': variant === 'b',
      'chip-d': variant === 'd',
      'chip-e': variant === 'e'
    },
    className
  )
}

// ============================================================================
// 환경 모드 유틸리티
// ============================================================================

export type TouchMode = 'normal' | 'glove' | 'precision'
export type Environment = 'normal' | 'bright-sun' | 'rain' | 'cold' | 'dust'

export const getTouchModeClasses = (mode: TouchMode, className?: string) => {
  if (mode === 'normal') return className
  
  return cn(
    `touch-mode-${mode}`,
    className
  )
}

export const getEnvironmentClasses = (env: Environment, className?: string) => {
  if (env === 'normal') return className
  
  return cn(
    `env-${env}`,
    className
  )
}

export const getCombinedEnvironmentClasses = (
  touchMode: TouchMode,
  environment: Environment,
  className?: string
) => {
  return cn(
    getTouchModeClasses(touchMode),
    getEnvironmentClasses(environment),
    className
  )
}

// ============================================================================
// 상태 표시 유틸리티
// ============================================================================

export type StatusType = 'success' | 'warning' | 'error' | 'info'

export const getStatusClasses = (type: StatusType, className?: string) => {
  return cn(
    `status-${type}`,
    className
  )
}

// ============================================================================
// 레이아웃 유틸리티
// ============================================================================

export const getContainerClasses = (className?: string) => {
  return cn('container', className)
}

export const getSectionClasses = (className?: string) => {
  return cn('section', className)
}

export const getButtonGroupClasses = (className?: string) => {
  return cn('btn-group', className)
}

// ============================================================================
// 폼 요소 유틸리티
// ============================================================================

export const getInputClasses = (className?: string) => {
  return cn('input', className)
}

export const getLabelClasses = (className?: string) => {
  return cn('block text-sm font-medium mb-2', className)
}

// ============================================================================
// 리스트 시스템 유틸리티
// ============================================================================

export const getRowClasses = (className?: string) => {
  return cn('row', className)
}

// ============================================================================
// 접근성 유틸리티
// ============================================================================

export const getHighContrastClasses = (className?: string) => {
  return cn('high-contrast', className)
}

export const getKeyboardNavigationClasses = (className?: string) => {
  return cn('keyboard-navigation', className)
}

export const getSkipLinkClasses = (className?: string) => {
  return cn('skip-link', className)
}

// ============================================================================
// 애니메이션 유틸리티
// ============================================================================

export const getThemeTransitionClasses = (className?: string) => {
  return cn('theme-transition', className)
}

export const getElevationHoverClasses = (className?: string) => {
  return cn('elevation-hover', className)
}

export const getPulseAnimationClasses = (className?: string) => {
  return cn('pulse-animation', className)
}

// ============================================================================
// 건설 현장 특화 유틸리티
// ============================================================================

export const getSunlightModeClasses = (className?: string) => {
  return cn('sunlight-mode', className)
}

export const getTouchTargetGloveClasses = (className?: string) => {
  return cn('touch-target-glove', className)
}

export const getWeatherResistantClasses = (className?: string) => {
  return cn('weather-resistant', className)
}

// ============================================================================
// 복합 컴포넌트 생성 함수
// ============================================================================

export interface ComponentConfig {
  card?: CardConfig
  button?: ButtonConfig
  touchMode?: TouchMode
  environment?: Environment
  className?: string
}

export const createComponentClasses = (config: ComponentConfig) => {
  const {
    card,
    button,
    touchMode,
    environment,
    className
  } = config

  const classes = []

  if (card) {
    classes.push(getCardClasses(card))
  }

  if (button) {
    classes.push(getButtonClasses(button))
  }

  if (touchMode && touchMode !== 'normal') {
    classes.push(getTouchModeClasses(touchMode))
  }

  if (environment && environment !== 'normal') {
    classes.push(getEnvironmentClasses(environment))
  }

  if (className) {
    classes.push(className)
  }

  return cn(...classes)
}

// ============================================================================
// 테마 관리 유틸리티
// ============================================================================

export const setTheme = (theme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

export const getTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  
  return savedTheme || systemTheme
}

export const toggleTheme = () => {
  const currentTheme = getTheme()
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
  return newTheme
}

// ============================================================================
// 환경 감지 유틸리티
// ============================================================================

export const detectTouchMode = (): TouchMode => {
  if (typeof window === 'undefined') return 'normal'
  
  // 터치 디바이스 감지
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  if (!isTouchDevice) return 'precision'
  
  // 화면 크기에 따른 터치 모드 결정
  const screenWidth = window.innerWidth
  if (screenWidth < 768) return 'glove' // 모바일은 기본적으로 장갑 모드
  if (screenWidth < 1024) return 'normal' // 태블릿은 일반 모드
  
  return 'precision' // 데스크톱은 정밀 모드
}

export const detectEnvironment = (): Environment => {
  if (typeof window === 'undefined') return 'normal'
  
  // 시간대에 따른 환경 감지 (간단한 예시)
  const hour = new Date().getHours()
  
  if (hour >= 6 && hour <= 18) {
    // 낮 시간대 - 햇빛이 강할 가능성
    return 'bright-sun'
  }
  
  return 'normal'
}

// ============================================================================
// 유틸리티 클래스 생성 함수
// ============================================================================

export const createUtilityClasses = {
  // 색상
  text: (color: string) => `text-${color}`,
  bg: (color: string) => `bg-${color}`,
  border: (color: string) => `border-${color}`,
  
  // 간격
  spacing: (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') => `spacing-${size}`,
  
  // 그림자
  shadow: (level: 'sm' | 'md' | 'lg' | 'xl') => `shadow-${level}`,
  
  // 전환
  transition: (speed: 'fast' | 'normal' | 'slow') => `transition-${speed}`
}

// ============================================================================
// 타입 가드 및 검증 함수
// ============================================================================

export const isValidTouchMode = (mode: string): mode is TouchMode => {
  return ['normal', 'glove', 'precision'].includes(mode)
}

export const isValidEnvironment = (env: string): env is Environment => {
  return ['normal', 'bright-sun', 'rain', 'cold', 'dust'].includes(env)
}

export const isValidChipVariant = (variant: string): variant is ChipVariant => {
  return ['a', 'b', 'd', 'e'].includes(variant)
}

export const isValidStatusType = (type: string): type is StatusType => {
  return ['success', 'warning', 'error', 'info'].includes(type)
}

// ============================================================================
// 기본 내보내기
// ============================================================================

export default {
  // 카드
  getCardClasses,
  
  // 버튼
  getButtonClasses,
  
  // 칩
  getChipClasses,
  
  // 환경 모드
  getTouchModeClasses,
  getEnvironmentClasses,
  getCombinedEnvironmentClasses,
  
  // 상태
  getStatusClasses,
  
  // 레이아웃
  getContainerClasses,
  getSectionClasses,
  getButtonGroupClasses,
  
  // 폼
  getInputClasses,
  getLabelClasses,
  
  // 리스트
  getRowClasses,
  
  // 접근성
  getHighContrastClasses,
  getKeyboardNavigationClasses,
  getSkipLinkClasses,
  
  // 애니메이션
  getThemeTransitionClasses,
  getElevationHoverClasses,
  getPulseAnimationClasses,
  
  // 건설 현장 특화
  getSunlightModeClasses,
  getTouchTargetGloveClasses,
  getWeatherResistantClasses,
  
  // 복합 컴포넌트
  createComponentClasses,
  
  // 테마 관리
  setTheme,
  getTheme,
  toggleTheme,
  
  // 환경 감지
  detectTouchMode,
  detectEnvironment,
  
  // 유틸리티
  createUtilityClasses,
  
  // 검증
  isValidTouchMode,
  isValidEnvironment,
  isValidChipVariant,
  isValidStatusType
}
