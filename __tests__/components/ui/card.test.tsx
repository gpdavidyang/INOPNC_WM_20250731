/**
 * Tests for Card Component
 * 
 * Testing the card UI component
 * for Task 14
 */

import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>
      )
      
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })
    
    it('should apply default styling', () => {
      render(<Card data-testid="card">Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('bg-white', 'dark:bg-toss-gray-800')
      expect(card).toHaveClass('rounded-2xl')
      expect(card).toHaveClass('border')
    })
    
    it('should accept custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>)
      
      expect(screen.getByTestId('card')).toHaveClass('custom-class')
    })
  })
  
  describe('CardHeader', () => {
    it('should render header with content', () => {
      render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })
    
    it('should apply header styling', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      )
      
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-4')
    })
  })
  
  describe('CardTitle', () => {
    it('should render title text', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })
    
    it('should apply title styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle data-testid="title">Title</CardTitle>
          </CardHeader>
        </Card>
      )
      
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('text-xl', 'font-semibold')
    })
  })
  
  describe('CardDescription', () => {
    it('should render description text', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      expect(screen.getByText('This is a description')).toBeInTheDocument()
    })
    
    it('should apply description styling', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription data-testid="desc">Description</CardDescription>
          </CardHeader>
        </Card>
      )
      
      const desc = screen.getByTestId('desc')
      expect(desc).toHaveClass('text-sm', 'text-toss-gray-500')
    })
  })
  
  describe('CardContent', () => {
    it('should render content area', () => {
      render(
        <Card>
          <CardContent>Main content</CardContent>
        </Card>
      )
      
      expect(screen.getByText('Main content')).toBeInTheDocument()
    })
    
    it('should apply content styling', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      )
      
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-4', 'pt-0')
    })
  })
  
  describe('CardFooter', () => {
    it('should render footer area', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })
    
    it('should apply footer styling', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      )
      
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-4', 'pt-0')
    })
  })
  
  describe('Complete Card Composition', () => {
    it('should render a complete card with all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Current project overview</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Project is on track</p>
          </CardContent>
          <CardFooter>
            <button>View Details</button>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByText('Project Status')).toBeInTheDocument()
      expect(screen.getByText('Current project overview')).toBeInTheDocument()
      expect(screen.getByText('Project is on track')).toBeInTheDocument()
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })
  })
  
  describe('Dark Mode', () => {
    it('should have dark mode classes', () => {
      render(<Card data-testid="card">Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('dark:bg-toss-gray-800', 'dark:border-toss-gray-700')
    })
  })
  
  describe('Accessibility', () => {
    it('should support custom props and refs', () => {
      const ref = React.createRef<HTMLDivElement>()
      
      render(
        <Card
          ref={ref}
          role="article"
          aria-label="Status card"
          data-testid="card"
        >
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-label', 'Status card')
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})