import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('should render badge with children', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Badge className="custom-class">Test</Badge>);
      const badge = screen.getByText('Test');
      expect(badge).toHaveClass('custom-class');
    });

    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<Badge ref={ref}>Test</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Base Styles', () => {
    it('should have pill shape (rounded-full)', () => {
      render(<Badge>Pill</Badge>);
      const badge = screen.getByText('Pill');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should have correct padding', () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('px-2.5');
      expect(badge).toHaveClass('py-0.5');
    });

    it('should have small font size', () => {
      render(<Badge>Small Text</Badge>);
      const badge = screen.getByText('Small Text');
      expect(badge).toHaveClass('text-xs');
      expect(badge).toHaveClass('font-medium');
    });

    it('should have transition', () => {
      render(<Badge>Smooth</Badge>);
      const badge = screen.getByText('Smooth');
      expect(badge).toHaveClass('transition-colors');
    });

    it('should be inline-flex', () => {
      render(<Badge>Flex</Badge>);
      const badge = screen.getByText('Flex');
      expect(badge).toHaveClass('inline-flex');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-neutral-100');
      expect(badge).toHaveClass('text-neutral-800');
      expect(badge).toHaveClass('border-neutral-200');
    });

    it('should render primary variant (cyan)', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('bg-brand-cyan/10');
      expect(badge).toHaveClass('text-brand-cyan');
      expect(badge).toHaveClass('border-brand-cyan/20');
    });

    it('should render success variant (green)', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-brand-green/10');
      expect(badge).toHaveClass('text-brand-green');
      expect(badge).toHaveClass('border-brand-green/20');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-warning/10');
      expect(badge).toHaveClass('text-warning');
      expect(badge).toHaveClass('border-warning/20');
    });

    it('should render danger variant', () => {
      render(<Badge variant="danger">Danger</Badge>);
      const badge = screen.getByText('Danger');
      expect(badge).toHaveClass('bg-error/10');
      expect(badge).toHaveClass('text-error');
      expect(badge).toHaveClass('border-error/20');
    });

    it('should use default variant when variant is undefined', () => {
      render(<Badge variant={undefined}>Undefined</Badge>);
      const badge = screen.getByText('Undefined');
      expect(badge).toHaveClass('bg-neutral-100');
    });
  });

  describe('Content Types', () => {
    it('should render text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('should render numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render with icon and text', () => {
      render(
        <Badge>
          <span>★</span>
          <span>Featured</span>
        </Badge>
      );
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('should render single emoji', () => {
      render(<Badge>🔥</Badge>);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(<Badge data-testid="custom-badge">Test</Badge>);
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Badge aria-label="Status badge">Active</Badge>);
      const badge = screen.getByLabelText('Status badge');
      expect(badge).toBeInTheDocument();
    });

    it('should pass through role attribute', () => {
      render(<Badge role="status">Loading</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      render(<Badge id="unique-badge">Content</Badge>);
      const badge = document.getElementById('unique-badge');
      expect(badge).toBeInTheDocument();
    });

    it('should pass through title attribute', () => {
      render(<Badge title="Tooltip text">Hover</Badge>);
      const badge = screen.getByText('Hover');
      expect(badge).toHaveAttribute('title', 'Tooltip text');
    });
  });

  describe('Combined Props', () => {
    it('should combine variant with custom className', () => {
      render(<Badge variant="success" className="custom-spacing">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-brand-green/10');
      expect(badge).toHaveClass('custom-spacing');
    });

    it('should handle all props together', () => {
      render(
        <Badge
          variant="primary"
          className="extra-class"
          data-testid="full-badge"
          aria-label="Full badge"
        >
          Complete
        </Badge>
      );
      const badge = screen.getByTestId('full-badge');
      expect(badge).toHaveClass('bg-brand-cyan/10');
      expect(badge).toHaveClass('extra-class');
      expect(badge).toHaveAttribute('aria-label', 'Full badge');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string children', () => {
      render(<Badge>{''}</Badge>);
      const badges = document.querySelectorAll('.rounded-full');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should handle whitespace children', () => {
      const { container } = render(<Badge>   </Badge>);
      const badge = container.querySelector('.rounded-full');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('   ');
    });

    it('should handle very long text', () => {
      const longText = 'This is a very long badge text that might wrap';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Badge>{'< > & " \''}</Badge>);
      expect(screen.getByText('< > & " \'')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as inline content', () => {
      render(<Badge>Accessible</Badge>);
      expect(screen.getByText('Accessible')).toBeInTheDocument();
    });

    it('should support status role for live updates', () => {
      render(<Badge role="status" aria-live="polite">3 unread</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('aria-live', 'polite');
    });

    it('should support descriptive labels', () => {
      render(<Badge aria-label="Priority: High" variant="danger">High</Badge>);
      const badge = screen.getByLabelText('Priority: High');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Visual Regression Prevention', () => {
    it('should maintain consistent styling across variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'danger'] as const;

      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        const badge = container.querySelector('.rounded-full');

        expect(badge).toHaveClass('rounded-full');
        expect(badge).toHaveClass('px-2.5');
        expect(badge).toHaveClass('py-0.5');
        expect(badge).toHaveClass('text-xs');
        expect(badge).toHaveClass('font-medium');
        expect(badge).toHaveClass('border');
      });
    });

    it('should have border on all variants', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'danger'] as const;

      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>Test</Badge>);
        const badge = container.querySelector('.rounded-full');
        expect(badge).toHaveClass('border');
      });
    });
  });

  describe('Use Cases', () => {
    it('should work as status indicator', () => {
      render(<Badge variant="success">Online</Badge>);
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should work as count indicator', () => {
      render(<Badge variant="primary">5</Badge>);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should work as tag/label', () => {
      render(<Badge variant="default">TypeScript</Badge>);
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('should work as notification badge', () => {
      render(<Badge variant="danger">99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
