import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner, PageSpinner } from './Spinner';

describe('Spinner', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild;
      expect(spinner).toBeInTheDocument();
    });

    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<Spinner ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render Loader2 icon', () => {
      const { container } = render(<Spinner />);
      const loader = container.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Base Styles', () => {
    it('should have inline-flex class', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('inline-flex');
    });

    it('should center content', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('items-center');
      expect(spinner).toHaveClass('justify-center');
    });

    it('should have animate-spin class on icon', () => {
      const { container } = render(<Spinner />);
      const icon = container.querySelector('.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('should have primary color on icon', () => {
      const { container } = render(<Spinner />);
      const icon = container.querySelector('.text-primary-500');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render medium size by default', () => {
      const { container } = render(<Spinner />);
      const icon = container.querySelector('.w-8.h-8');
      expect(icon).toBeInTheDocument();
    });

    it('should render small size', () => {
      const { container } = render(<Spinner size="sm" />);
      const icon = container.querySelector('.w-4.h-4');
      expect(icon).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<Spinner size="lg" />);
      const icon = container.querySelector('.w-12.h-12');
      expect(icon).toBeInTheDocument();
    });

    it('should handle undefined size gracefully', () => {
      const { container } = render(<Spinner size={undefined} />);
      const icon = container.querySelector('.w-8.h-8');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<Spinner className="custom-spinner" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('custom-spinner');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(<Spinner className="custom-class" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('custom-class');
      expect(spinner).toHaveClass('inline-flex');
      expect(spinner).toHaveClass('items-center');
    });

    it('should allow overriding styles', () => {
      const { container } = render(<Spinner className="text-red-500" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('text-red-500');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(<Spinner data-testid="loading-spinner" />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Spinner aria-label="Loading content" />);
      expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
    });

    it('should pass through role attribute', () => {
      render(<Spinner role="status" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      const { container } = render(<Spinner id="main-spinner" />);
      const spinner = container.querySelector('#main-spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should combine size and className', () => {
      const { container } = render(<Spinner size="lg" className="text-blue-500" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('text-blue-500');
      const icon = container.querySelector('.w-12.h-12');
      expect(icon).toBeInTheDocument();
    });

    it('should handle all props together', () => {
      render(
        <Spinner
          size="sm"
          className="custom"
          data-testid="full-spinner"
          aria-label="Loading"
          role="status"
        />
      );
      const spinner = screen.getByTestId('full-spinner');
      expect(spinner).toHaveClass('custom');
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support status role for screen readers', () => {
      render(<Spinner role="status" aria-label="Loading" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should support aria-label for assistive tech', () => {
      render(<Spinner aria-label="Content is loading" />);
      expect(screen.getByLabelText('Content is loading')).toBeInTheDocument();
    });

    it('should support aria-live for dynamic updates', () => {
      render(<Spinner aria-live="polite" />);
      const { container } = render(<Spinner aria-live="polite" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain animation across all sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

      sizes.forEach(size => {
        const { container } = render(<Spinner size={size} />);
        const icon = container.querySelector('.animate-spin');
        expect(icon).toBeInTheDocument();
      });
    });

    it('should maintain color across all sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

      sizes.forEach(size => {
        const { container } = render(<Spinner size={size} />);
        const icon = container.querySelector('.text-primary-500');
        expect(icon).toBeInTheDocument();
      });
    });
  });
});

describe('PageSpinner', () => {
  describe('Rendering', () => {
    it('should render full page spinner', () => {
      const { container } = render(<PageSpinner />);
      const pageSpinner = container.firstChild;
      expect(pageSpinner).toBeInTheDocument();
    });

    it('should render Spinner component', () => {
      const { container } = render(<PageSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Overlay Styles', () => {
    it('should have fixed positioning', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });

    it('should center spinner', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('flex');
      expect(overlay).toHaveClass('items-center');
      expect(overlay).toHaveClass('justify-center');
    });

    it('should have backdrop styling', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('bg-neutral-50/80');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should have high z-index', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('z-50');
    });
  });

  describe('Spinner Size', () => {
    it('should render large spinner', () => {
      const { container } = render(<PageSpinner />);
      const icon = container.querySelector('.w-12.h-12');
      expect(icon).toBeInTheDocument();
    });

    it('should use Spinner component with lg size', () => {
      const { container } = render(<PageSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a loading indicator', () => {
      const { container } = render(<PageSpinner />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should block interaction with content below', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      // Fixed positioning with full inset blocks interaction
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });
  });

  describe('Visual Appearance', () => {
    it('should have semi-transparent background', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('bg-neutral-50/80');
    });

    it('should have blur effect', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should overlay entire viewport', () => {
      const { container } = render(<PageSpinner />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple PageSpinners without conflict', () => {
      const { container } = render(
        <>
          <PageSpinner />
          <PageSpinner />
        </>
      );
      const spinners = container.querySelectorAll('.animate-spin');
      expect(spinners.length).toBe(2);
    });

    it('should render consistently', () => {
      const { container: container1 } = render(<PageSpinner />);
      const { container: container2 } = render(<PageSpinner />);

      const overlay1 = container1.firstChild as HTMLElement;
      const overlay2 = container2.firstChild as HTMLElement;

      expect(overlay1.className).toBe(overlay2.className);
    });
  });
});
