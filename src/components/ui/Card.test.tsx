import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<Card className="custom-class">Test</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Test</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render multiple children', () => {
      render(
        <Card>
          <div>Child 1</div>
          <div>Child 2</div>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Base Styles', () => {
    it('should have white background', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
    });

    it('should have rounded corners', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg');
    });

    it('should have border', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-neutral-200');
    });

    it('should have transition', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('transition-colors');
    });
  });

  describe('Padding Variants', () => {
    it('should have default padding (p-6)', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-6');
    });

    it('should have compact padding when compact is true', () => {
      const { container } = render(<Card compact>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
      expect(card).not.toHaveClass('p-6');
    });

    it('should use default padding when compact is false', () => {
      const { container } = render(<Card compact={false}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-6');
    });
  });

  describe('Hoverable Prop', () => {
    it('should not be hoverable by default', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:border-neutral-300');
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('should add hover styles when hoverable is true', () => {
      const { container } = render(<Card hoverable>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('hover:border-neutral-300');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should not add hover styles when hoverable is false', () => {
      const { container } = render(<Card hoverable={false}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('hover:border-neutral-300');
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Interactive Behavior', () => {
    it('should handle onClick when hoverable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Card hoverable onClick={handleClick}>Clickable Card</Card>);
      const card = container.firstChild as HTMLElement;

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle onClick even without hoverable', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<Card onClick={handleClick}>Clickable Card</Card>);
      const card = container.firstChild as HTMLElement;

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not have cursor-pointer without hoverable', () => {
      const handleClick = vi.fn();
      const { container } = render(<Card onClick={handleClick}>Card</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('cursor-pointer');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(<Card data-testid="custom-card">Test</Card>);
      const card = screen.getByTestId('custom-card');
      expect(card).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Card aria-label="Card label">Content</Card>);
      const card = screen.getByLabelText('Card label');
      expect(card).toBeInTheDocument();
    });

    it('should pass through role attribute', () => {
      render(<Card role="article">Article Card</Card>);
      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      render(<Card id="unique-card">Content</Card>);
      const card = document.getElementById('unique-card');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should combine hoverable and compact', () => {
      const { container } = render(<Card hoverable compact>Combined</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
      expect(card).toHaveClass('hover:border-neutral-300');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('should combine all props with custom className', () => {
      render(
        <Card
          hoverable
          compact
          className="custom-border"
          data-testid="full-card"
        >
          Full Card
        </Card>
      );
      const card = screen.getByTestId('full-card');
      expect(card).toHaveClass('custom-border');
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<Card>{''}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle null children', () => {
      const { container } = render(<Card>{null}</Card>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle undefined className', () => {
      const { container } = render(<Card className={undefined}>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
    });

    it('should handle complex nested content', () => {
      render(
        <Card>
          <div>
            <h2>Title</h2>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a generic container', () => {
      render(<Card>Accessible content</Card>);
      expect(screen.getByText('Accessible content')).toBeInTheDocument();
    });

    it('should support custom roles for semantic HTML', () => {
      render(<Card role="region" aria-labelledby="card-title">
        <h2 id="card-title">Card Title</h2>
      </Card>);
      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('should indicate clickable state with cursor', () => {
      const { container } = render(<Card hoverable>Clickable</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });
});
