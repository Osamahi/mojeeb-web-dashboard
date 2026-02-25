import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  describe('Rendering', () => {
    it('should render textarea', () => {
      render(<Textarea placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Textarea label="Description" placeholder="Enter description" />);
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
    });

    it('should forward ref to textarea element', () => {
      const ref = { current: null };
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should render without label', () => {
      const { container } = render(<Textarea placeholder="No label" />);
      const labels = container.querySelectorAll('label');
      expect(labels.length).toBe(0);
    });
  });

  describe('Base Styles', () => {
    it('should have full width', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('w-full');
    });

    it('should have rounded corners', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('rounded-md');
    });

    it('should have border', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('border');
      expect(textarea).toHaveClass('border-neutral-300');
    });

    it('should have white background', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('bg-white');
    });

    it('should have transition', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('transition-colors');
    });

    it('should have resize-none class', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('resize-none');
    });
  });

  describe('Error States', () => {
    it('should render error message', () => {
      render(<Textarea error="Invalid input" placeholder="Test" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    it('should have error border styles', () => {
      render(<Textarea error="Error" placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('border-error');
      expect(textarea).toHaveClass('focus:border-error');
      expect(textarea).toHaveClass('focus:ring-error/20');
    });

    it('should not show error message when error is undefined', () => {
      render(<Textarea placeholder="Test" />);
      const errors = screen.queryByText(/error/i);
      expect(errors).not.toBeInTheDocument();
    });

    it('should display error with correct styling', () => {
      render(<Textarea error="Field required" placeholder="Test" />);
      const errorElement = screen.getByText('Field required');
      expect(errorElement).toHaveClass('text-sm');
      expect(errorElement).toHaveClass('text-error');
    });
  });

  describe('Helper Text', () => {
    it('should render helper text when no error', () => {
      render(<Textarea helperText="Enter detailed description" placeholder="Test" />);
      expect(screen.getByText('Enter detailed description')).toBeInTheDocument();
    });

    it('should not show helper text when error is present', () => {
      render(
        <Textarea
          helperText="Helper text"
          error="Error message"
          placeholder="Test"
        />
      );
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should have correct helper text styling', () => {
      render(<Textarea helperText="Helper" placeholder="Test" />);
      const helper = screen.getByText('Helper');
      expect(helper).toHaveClass('text-sm');
      expect(helper).toHaveClass('text-neutral-500');
    });
  });

  describe('Character Count', () => {
    it('should show character count when showCharCount is true', () => {
      render(<Textarea showCharCount value="Hello" onChange={() => {}} placeholder="Test" />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not show character count by default', () => {
      render(<Textarea value="Hello" onChange={() => {}} placeholder="Test" />);
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('should show character count with maxChars', () => {
      render(
        <Textarea
          showCharCount
          maxChars={100}
          value="Test"
          onChange={() => {}}
          placeholder="Test"
        />
      );
      expect(screen.getByText('4 / 100')).toBeInTheDocument();
    });

    it('should show error styling when exceeding maxChars', () => {
      render(
        <Textarea
          showCharCount
          maxChars={10}
          value="This is a very long text"
          onChange={() => {}}
          placeholder="Test"
        />
      );
      const charCount = screen.getByText(/24/);
      expect(charCount).toHaveClass('text-error');
      expect(charCount).toHaveClass('font-medium');
    });

    it('should show normal styling when within maxChars', () => {
      render(
        <Textarea
          showCharCount
          maxChars={50}
          value="Short text"
          onChange={() => {}}
          placeholder="Test"
        />
      );
      const charCount = screen.getByText(/10/);
      expect(charCount).toHaveClass('text-neutral-500');
      expect(charCount).not.toHaveClass('text-error');
    });

    it('should update character count on value change', () => {
      const { rerender } = render(
        <Textarea showCharCount value="Hello" onChange={() => {}} placeholder="Test" />
      );
      expect(screen.getByText('5')).toBeInTheDocument();

      rerender(
        <Textarea showCharCount value="Hello World" onChange={() => {}} placeholder="Test" />
      );
      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('should show 0 for empty value', () => {
      render(<Textarea showCharCount value="" onChange={() => {}} placeholder="Test" />);
      expect(screen.getByText(/^0/)).toBeInTheDocument();
    });
  });

  describe('Auto Resize', () => {
    it('should have auto-resize enabled by default', () => {
      render(<Textarea value="Test" onChange={() => {}} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
    });

    it('should have min height style', () => {
      render(<Textarea minHeight={100} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea.style.minHeight).toBe('100px');
    });

    it('should have max height style when autoResize is true', () => {
      render(<Textarea autoResize maxHeight={300} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea.style.maxHeight).toBe('300px');
    });

    it('should not have max height when autoResize is false', () => {
      render(<Textarea autoResize={false} maxHeight={300} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea.style.maxHeight).toBe('');
    });

    it('should use default minHeight of 80px', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea.style.minHeight).toBe('80px');
    });

    it('should use default maxHeight of 400px', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea.style.maxHeight).toBe('400px');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Textarea disabled placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('disabled:bg-neutral-50');
      expect(textarea).toHaveClass('disabled:text-neutral-500');
      expect(textarea).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not be disabled by default', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Value and Changes', () => {
    it('should display initial value', () => {
      render(<Textarea defaultValue="Initial value" />);
      const textarea = screen.getByDisplayValue('Initial value') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial value');
    });

    it('should handle controlled value', () => {
      const { rerender } = render(<Textarea value="Test" onChange={() => {}} />);
      const textarea = screen.getByDisplayValue('Test') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test');

      rerender(<Textarea value="Updated" onChange={() => {}} />);
      expect(textarea.value).toBe('Updated');
    });

    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Textarea onChange={handleChange} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');

      await user.type(textarea, 'Hello');
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;

      await user.type(textarea, 'Hello World');
      expect(textarea.value).toBe('Hello World');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through placeholder', () => {
      render(<Textarea placeholder="Enter your message" />);
      expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
    });

    it('should pass through name attribute', () => {
      render(<Textarea name="description" placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveAttribute('name', 'description');
    });

    it('should pass through id attribute', () => {
      render(<Textarea id="message-input" placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveAttribute('id', 'message-input');
    });

    it('should pass through data attributes', () => {
      render(<Textarea data-testid="custom-textarea" placeholder="Test" />);
      expect(screen.getByTestId('custom-textarea')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Textarea aria-label="Message textarea" placeholder="Test" />);
      const textarea = screen.getByLabelText('Message textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('should pass through required attribute', () => {
      render(<Textarea required placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toBeRequired();
    });

    it('should pass through maxLength attribute', () => {
      render(<Textarea maxLength={500} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    it('should pass through rows attribute', () => {
      render(<Textarea rows={5} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<Textarea className="custom-textarea" placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('custom-textarea');
    });

    it('should preserve base classes with custom className', () => {
      render(<Textarea className="custom-class" placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('custom-class');
      expect(textarea).toHaveClass('w-full');
      expect(textarea).toHaveClass('bg-white');
    });
  });

  describe('Combined Props', () => {
    it('should combine label and error', () => {
      render(<Textarea label="Message" error="Required field" placeholder="Test" />);
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });

    it('should combine error and character count', () => {
      render(
        <Textarea
          error="Too long"
          showCharCount
          maxChars={10}
          value="Very long text"
          onChange={() => {}}
          placeholder="Test"
        />
      );
      expect(screen.getByText('Too long')).toBeInTheDocument();
      expect(screen.getByText(/14/)).toBeInTheDocument();
    });

    it('should combine all props', () => {
      render(
        <Textarea
          label="Description"
          error="Required"
          helperText="Helper"
          showCharCount
          maxChars={100}
          value="Test"
          onChange={() => {}}
          placeholder="Enter description"
          disabled
          className="custom"
        />
      );
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
      expect(screen.getByText(/4 \/ 100/)).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText('Enter description');
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass('custom');
    });
  });

  describe('Focus States', () => {
    it('should have focus ring styles', () => {
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveClass('focus:outline-none');
      expect(textarea).toHaveClass('focus:ring-2');
      expect(textarea).toHaveClass('focus:ring-brand-mojeeb/20');
      expect(textarea).toHaveClass('focus:border-brand-mojeeb');
    });

    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');

      await user.click(textarea);
      expect(textarea).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<Textarea label="Message" placeholder="Test" />);
      const label = screen.getByText('Message');
      expect(label.tagName).toBe('LABEL');
    });

    it('should support aria-label', () => {
      render(<Textarea aria-label="Message field" placeholder="Test" />);
      expect(screen.getByLabelText('Message field')).toBeInTheDocument();
    });

    it('should support aria-describedby for errors', () => {
      render(<Textarea aria-describedby="error-message" placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');

      await user.tab();
      expect(textarea).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Textarea value="" onChange={() => {}} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(1000);
      const user = userEvent.setup();
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;

      await user.type(textarea, longText);
      expect(textarea.value).toBe(longText);
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test') as HTMLTextAreaElement;

      await user.type(textarea, '<script>alert("xss")</script>');
      expect(textarea.value).toBe('<script>alert("xss")</script>');
    });

    it('should handle multiline text', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');

      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');
      expect((textarea as HTMLTextAreaElement).value).toContain('\n');
    });

    it('should handle undefined value gracefully', () => {
      render(<Textarea value={undefined} placeholder="Test" />);
      const textarea = screen.getByPlaceholderText('Test');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Bottom Info Row Layout', () => {
    it('should display error and character count in same row', () => {
      const { container } = render(
        <Textarea
          error="Error"
          showCharCount
          value="Test"
          onChange={() => {}}
          placeholder="Test"
        />
      );
      const infoRow = container.querySelector('.flex.items-center.justify-between');
      expect(infoRow).toBeInTheDocument();
    });

    it('should align error to left and count to right', () => {
      const { container } = render(
        <Textarea
          error="Error"
          showCharCount
          value="Test"
          onChange={() => {}}
          placeholder="Test"
        />
      );
      const errorContainer = container.querySelector('.flex-1');
      expect(errorContainer).toBeInTheDocument();
    });
  });
});
