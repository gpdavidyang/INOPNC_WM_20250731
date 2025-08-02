import { formatDate, formatDateTime, cn } from '@/lib/utils'

describe('utils', () => {
  describe('formatDate', () => {
    it('should format string date correctly', () => {
      expect(formatDate('2023-12-25T10:30:45Z')).toBe('2023-12-25')
    })

    it('should format Date object correctly', () => {
      const date = new Date('2023-12-25T10:30:45Z')
      expect(formatDate(date)).toBe('2023-12-25')
    })

    it('should handle different date formats', () => {
      expect(formatDate('2023-01-01')).toBe('2023-01-01')
      expect(formatDate('2023/06/15')).toBe('2023-06-15')
    })

    it('should pad single digit months and days', () => {
      expect(formatDate('2023-1-5')).toBe('2023-01-05')
      expect(formatDate(new Date(2023, 0, 5))).toBe('2023-01-05')
    })
  })

  describe('formatDateTime', () => {
    it('should format string date with time correctly', () => {
      // Use a date without timezone to avoid local timezone conversion
      const result = formatDateTime('2023-12-25T10:30:45')
      expect(result).toMatch(/2023-12-25 \d{2}:\d{2}/)
    })

    it('should format Date object with time correctly', () => {
      const date = new Date(2023, 11, 25, 10, 30, 45) // Month is 0-indexed
      expect(formatDateTime(date)).toBe('2023-12-25 10:30')
    })

    it('should pad single digit values', () => {
      const date = new Date(2023, 0, 5, 9, 5, 0) // January is 0, so 0 = January
      expect(formatDateTime(date)).toBe('2023-01-05 09:05')
    })

    it('should handle midnight correctly', () => {
      const date = new Date(2023, 11, 25, 0, 0, 0)
      expect(formatDateTime(date)).toBe('2023-12-25 00:00')
    })

    it('should handle 24 hour format', () => {
      const date = new Date(2023, 11, 25, 23, 59, 59)
      expect(formatDateTime(date)).toBe('2023-12-25 23:59')
    })
  })

  describe('cn (className utility)', () => {
    it('should combine string classes', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    })

    it('should handle conditional classes with objects', () => {
      expect(cn('base-class', {
        'active-class': true,
        'inactive-class': false
      })).toBe('base-class active-class')
    })

    it('should handle array of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })

    it('should filter out falsy values', () => {
      expect(cn('base', null, undefined, false, '', 'valid')).toBe('base valid')
    })

    it('should merge tailwind classes correctly', () => {
      // twMerge should handle conflicting utilities
      expect(cn('px-2', 'px-4')).toBe('px-4') // Later utility wins
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('should handle complex combinations', () => {
      const result = cn(
        'base-class',
        {
          'conditional-class': true,
          'false-class': false
        },
        ['array-class-1', 'array-class-2'],
        undefined,
        'final-class'
      )
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).toContain('array-class-1')
      expect(result).toContain('array-class-2')
      expect(result).toContain('final-class')
      expect(result).not.toContain('false-class')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null)).toBe('')
      expect(cn(undefined)).toBe('')
    })
  })
})