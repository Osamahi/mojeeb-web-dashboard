import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { Search } from 'lucide-react';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('should render with title', () => {
      render(<EmptyState title="No results found" />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render with description', () => {
      render(<EmptyState title="Empty" description="Add some content to get started" />);
      expect(screen.getByText('Add some content to get started')).toBeInTheDocument();
    });

    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<EmptyState ref={ref} title="Test" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render without description', () => {
      render(<EmptyState title="Just a title" />);
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should render default Inbox icon when no icon provided', () => {
      const { container } = render(<EmptyState title="Empty" />);
      // Inbox icon from lucide-react
      const icon = container.querySelector('.lucide-inbox');
      expect(icon).toBeInTheDocument();
    });

    it('should render custom icon', () => {
      render(
        <EmptyState
          title="Search empty"
          icon={<Search data-testid="custom-icon" />}
        />
      );
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should render icon in circular background', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const iconContainer = container.querySelector('.rounded-full.bg-neutral-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render custom React node as icon', () => {
      render(
        <EmptyState
          title="Custom"
          icon={<div data-testid="custom-element">Custom</div>}
        />
      );
      expect(screen.getByTestId('custom-element')).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should render action button when provided', () => {
      render(
        <EmptyState
          title="No data"
          action={<Button>Add Item</Button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });

    it('should not render action section when action is undefined', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const actionContainer = container.querySelector('div > div:last-child');
      // Should only have icon, title, no action section
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render custom action element', () => {
      render(
        <EmptyState
          title="Empty"
          action={<a href="#" data-testid="custom-action">Learn more</a>}
        />
      );
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });

    it('should render multiple action buttons', () => {
      render(
        <EmptyState
          title="Empty"
          action={
            <div className="flex gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
          }
        />
      );
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Secondary')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have centered flex layout', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should have padding', () => {
      const { container } = render(<EmptyState title="Empty" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('py-16');
      expect(wrapper).toHaveClass('px-4');
    });

    it('should apply custom className', () => {
      const { container } = render(<EmptyState title="Empty" className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(<EmptyState title="Empty" className="bg-red-50" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-red-50');
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
    });
  });

  describe('Typography', () => {
    it('should have correct title styling', () => {
      const { container } = render(<EmptyState title="Test Title" />);
      const title = screen.getByText('Test Title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('text-neutral-900');
    });

    it('should have correct description styling', () => {
      render(<EmptyState title="Title" description="Description text" />);
      const description = screen.getByText('Description text');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-neutral-600');
      expect(description).toHaveClass('text-center');
      expect(description).toHaveClass('max-w-sm');
    });

    it('should center description text', () => {
      render(<EmptyState title="Title" description="Centered description" />);
      const description = screen.getByText('Centered description');
      expect(description).toHaveClass('text-center');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(<EmptyState title="Empty" data-testid="custom-empty-state" />);
      expect(screen.getByTestId('custom-empty-state')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<EmptyState title="Empty" aria-label="No content available" />);
      expect(screen.getByLabelText('No content available')).toBeInTheDocument();
    });

    it('should pass through role attribute', () => {
      render(<EmptyState title="Empty" role="status" />);
      const emptyState = screen.getByRole('status');
      expect(emptyState).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      const { container } = render(<EmptyState title="Empty" id="main-empty-state" />);
      const element = container.querySelector('#main-empty-state');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should render all props together', () => {
      render(
        <EmptyState
          title="No conversations"
          description="Start a new conversation to see it here"
          icon={<Search className="w-12 h-12" />}
          action={<Button>New Conversation</Button>}
          data-testid="full-empty-state"
        />
      );

      expect(screen.getByText('No conversations')).toBeInTheDocument();
      expect(screen.getByText('Start a new conversation to see it here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Conversation' })).toBeInTheDocument();
      expect(screen.getByTestId('full-empty-state')).toBeInTheDocument();
    });

    it('should handle title + icon only', () => {
      render(
        <EmptyState
          title="Minimal state"
          icon={<Search />}
        />
      );
      expect(screen.getByText('Minimal state')).toBeInTheDocument();
    });

    it('should handle title + action only', () => {
      render(
        <EmptyState
          title="Quick action"
          action={<Button>Click me</Button>}
        />
      );
      expect(screen.getByText('Quick action')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should work as empty search results', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your search terms"
          icon={<Search />}
        />
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
    });

    it('should work as empty list state', () => {
      render(
        <EmptyState
          title="No items yet"
          description="Add your first item to get started"
          action={<Button>Add Item</Button>}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should work as error state', () => {
      render(
        <EmptyState
          title="Something went wrong"
          description="Please try again later"
          action={<Button>Retry</Button>}
        />
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'This is a very long title that might need to wrap to multiple lines';
      render(<EmptyState title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDesc = 'This is a very long description with lots of text that explains the empty state in great detail and might wrap to multiple lines';
      render(<EmptyState title="Title" description={longDesc} />);
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('should handle empty title gracefully', () => {
      render(<EmptyState title="" />);
      // Component should still render
      const { container } = render(<EmptyState title="" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      render(
        <EmptyState
          title="<Title> & 'Description'"
          description={"Special characters: < > & \" '"}
        />
      );
      expect(screen.getByText("< > & \" '", { exact: false })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a status indicator', () => {
      render(<EmptyState title="No data" role="status" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should support aria-label for screen readers', () => {
      render(<EmptyState title="Empty" aria-label="No content available" />);
      expect(screen.getByLabelText('No content available')).toBeInTheDocument();
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(
        <EmptyState title="Test" description="Description" />
      );

      const title = container.querySelector('h3');
      const description = container.querySelector('p');

      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });

    it('should be keyboard accessible when action is provided', () => {
      render(
        <EmptyState
          title="Empty"
          action={<Button>Action</Button>}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain consistent icon container styling', () => {
      const { container: container1 } = render(<EmptyState title="Test 1" />);
      const { container: container2 } = render(
        <EmptyState title="Test 2" icon={<Search />} />
      );

      const iconContainer1 = container1.querySelector('.rounded-full');
      const iconContainer2 = container2.querySelector('.rounded-full');

      expect(iconContainer1).toHaveClass('bg-neutral-100');
      expect(iconContainer2).toHaveClass('bg-neutral-100');
    });

    it('should maintain consistent spacing', () => {
      const { container } = render(
        <EmptyState title="Test" description="Desc" action={<Button>Act</Button>} />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('py-16');
      expect(wrapper).toHaveClass('px-4');
    });
  });
});
