import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    });

    it('should forward ref to input element', () => {
      const ref = { current: null };
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should render without label', () => {
      const { container } = render(<Input placeholder="No label" />);
      const labels = container.querySelectorAll('label');
      expect(labels.length).toBe(0);
    });
  });

  describe('Base Styles', () => {
    it('should have full width', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('w-full');
    });

    it('should have correct height', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('h-10');
    });

    it('should have rounded corners', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('rounded-md');
    });

    it('should have border', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('border-neutral-300');
    });

    it('should have white background', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('bg-white');
    });

    it('should have transition', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('transition-colors');
    });
  });

  describe('Focus States', () => {
    it('should have focus ring styles', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-brand-cyan/20');
      expect(input).toHaveClass('focus:border-brand-cyan');
    });

    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');

      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe('Error States', () => {
    it('should render error message', () => {
      render(<Input error="Invalid input" placeholder="Test" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    it('should have error border styles', () => {
      render(<Input error="Error" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('border-error');
      expect(input).toHaveClass('focus:border-error');
      expect(input).toHaveClass('focus:ring-error/20');
    });

    it('should not show error message when error is undefined', () => {
      render(<Input placeholder="Test" />);
      const errors = screen.queryByText(/error/i);
      expect(errors).not.toBeInTheDocument();
    });

    it('should display error below input', () => {
      const { container } = render(<Input error="Field required" placeholder="Test" />);
      const errorElement = screen.getByText('Field required');
      expect(errorElement).toHaveClass('mt-1.5');
      expect(errorElement).toHaveClass('text-sm');
      expect(errorElement).toHaveClass('text-error');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Input disabled placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('disabled:bg-neutral-50');
      expect(input).toHaveClass('disabled:text-neutral-500');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not be disabled by default', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Input Types', () => {
    it('should render text type by default', () => {
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render password type', () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render email type', () => {
      render(<Input type="email" placeholder="Email" />);
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render number type', () => {
      render(<Input type="number" placeholder="Number" />);
      const input = screen.getByPlaceholderText('Number');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Value and Changes', () => {
    it('should display initial value', () => {
      render(<Input defaultValue="Initial value" />);
      const input = screen.getByDisplayValue('Initial value') as HTMLInputElement;
      expect(input.value).toBe('Initial value');
    });

    it('should handle controlled value', () => {
      const { rerender } = render(<Input value="Test" onChange={() => {}} />);
      const input = screen.getByDisplayValue('Test') as HTMLInputElement;
      expect(input.value).toBe('Test');

      rerender(<Input value="Updated" onChange={() => {}} />);
      expect(input.value).toBe('Updated');
    });

    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');

      await user.type(input, 'Hello');
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(5); // Once per character
    });

    it('should update value when typing', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test') as HTMLInputElement;

      await user.type(input, 'Hello World');
      expect(input.value).toBe('Hello World');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through placeholder', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('should pass through name attribute', () => {
      render(<Input name="username" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should pass through id attribute', () => {
      render(<Input id="email-input" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('should pass through data attributes', () => {
      render(<Input data-testid="custom-input" placeholder="Test" />);
      expect(screen.getByTestId('custom-input')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Input aria-label="Username input" placeholder="Test" />);
      const input = screen.getByLabelText('Username input');
      expect(input).toBeInTheDocument();
    });

    it('should pass through required attribute', () => {
      render(<Input required placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toBeRequired();
    });

    it('should pass through maxLength attribute', () => {
      render(<Input maxLength={10} placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<Input className="custom-class" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('custom-class');
    });

    it('should preserve base classes with custom className', () => {
      render(<Input className="custom-class" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('bg-white');
    });
  });

  describe('Combined Props', () => {
    it('should combine label and error', () => {
      render(<Input label="Email" error="Invalid email" placeholder="Test" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should combine disabled and error', () => {
      render(<Input disabled error="Error" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toBeDisabled();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should combine all props', () => {
      render(
        <Input
          label="Username"
          error="Required"
          placeholder="Enter username"
          disabled
          type="text"
          className="custom"
        />
      );
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Required')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Enter username');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('custom');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<Input label="Email address" placeholder="Test" />);
      const label = screen.getByText('Email address');
      expect(label.tagName).toBe('LABEL');
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search field" placeholder="Test" />);
      expect(screen.getByLabelText('Search field')).toBeInTheDocument();
    });

    it('should support aria-describedby for errors', () => {
      render(<Input aria-describedby="error-message" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');

      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" onChange={() => {}} placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle very long label', () => {
      const longLabel = 'This is a very long label that might wrap to multiple lines';
      render(<Input label={longLabel} placeholder="Test" />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle very long error message', () => {
      const longError = 'This is a very long error message that describes what went wrong';
      render(<Input error={longError} placeholder="Test" />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle special characters in value', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test') as HTMLInputElement;

      await user.type(input, '<script>alert("xss")</script>');
      expect(input.value).toBe('<script>alert("xss")</script>');
    });
  });
});
