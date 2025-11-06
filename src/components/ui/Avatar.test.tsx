import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

// Mock the getInitials utility
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    getInitials: (name: string) => {
      if (!name) return '?';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },
  };
});

describe('Avatar', () => {
  describe('Rendering', () => {
    it('should render avatar with image', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User avatar" />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render initials when no image provided', () => {
      render(<Avatar name="John Doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render question mark when no name or image', () => {
      render(<Avatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<Avatar ref={ref} name="Test" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Image Display', () => {
    it('should render image with src prop', () => {
      render(<Avatar src="/avatar.png" name="John Doe" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/avatar.png');
    });

    it('should use alt text when provided', () => {
      render(<Avatar src="/avatar.png" alt="Custom alt text" />);
      const img = screen.getByAltText('Custom alt text');
      expect(img).toBeInTheDocument();
    });

    it('should use name as alt text when alt not provided', () => {
      render(<Avatar src="/avatar.png" name="Jane Smith" />);
      const img = screen.getByAltText('Jane Smith');
      expect(img).toBeInTheDocument();
    });

    it('should use default alt text when neither alt nor name provided', () => {
      render(<Avatar src="/avatar.png" />);
      const img = screen.getByAltText('Avatar');
      expect(img).toBeInTheDocument();
    });

    it('should have object-cover class on image', () => {
      render(<Avatar src="/avatar.png" name="Test" />);
      const img = screen.getByRole('img');
      expect(img).toHaveClass('object-cover');
      expect(img).toHaveClass('w-full');
      expect(img).toHaveClass('h-full');
    });
  });

  describe('Initials Fallback', () => {
    it('should display initials from name', () => {
      render(<Avatar name="Alice Johnson" />);
      expect(screen.getByText('AJ')).toBeInTheDocument();
    });

    it('should display single initial for single name', () => {
      render(<Avatar name="Alice" />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should display initials with white text', () => {
      const { container } = render(<Avatar name="Test User" />);
      const initialsDiv = container.querySelector('.text-white');
      expect(initialsDiv).toBeInTheDocument();
    });

    it('should have gradient background for initials', () => {
      const { container } = render(<Avatar name="Test User" />);
      const initialsDiv = container.querySelector('[style*="linear-gradient"]');
      expect(initialsDiv).toBeInTheDocument();
    });

    it('should display question mark when name is empty string', () => {
      render(<Avatar name="" />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should center initials', () => {
      const { container } = render(<Avatar name="Test" />);
      const initialsDiv = container.querySelector('.flex.items-center.justify-center');
      expect(initialsDiv).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render medium size by default', () => {
      const { container } = render(<Avatar name="Test" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('w-10');
      expect(avatar).toHaveClass('h-10');
      expect(avatar).toHaveClass('text-sm');
    });

    it('should render small size', () => {
      const { container } = render(<Avatar name="Test" size="sm" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('w-8');
      expect(avatar).toHaveClass('h-8');
      expect(avatar).toHaveClass('text-xs');
    });

    it('should render large size', () => {
      const { container } = render(<Avatar name="Test" size="lg" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('w-12');
      expect(avatar).toHaveClass('h-12');
      expect(avatar).toHaveClass('text-base');
    });

    it('should render extra large size', () => {
      const { container } = render(<Avatar name="Test" size="xl" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('w-16');
      expect(avatar).toHaveClass('h-16');
      expect(avatar).toHaveClass('text-lg');
    });
  });

  describe('Base Styles', () => {
    it('should have rounded-full class', () => {
      const { container } = render(<Avatar name="Test" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('rounded-full');
    });

    it('should have overflow-hidden class', () => {
      const { container } = render(<Avatar name="Test" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('overflow-hidden');
    });

    it('should have inline-flex class', () => {
      const { container } = render(<Avatar name="Test" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('inline-flex');
    });

    it('should center content', () => {
      const { container } = render(<Avatar name="Test" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('items-center');
      expect(avatar).toHaveClass('justify-center');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<Avatar name="Test" className="custom-avatar" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(<Avatar name="Test" className="custom-class" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('custom-class');
      expect(avatar).toHaveClass('rounded-full');
      expect(avatar).toHaveClass('inline-flex');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      render(<Avatar name="Test" data-testid="custom-avatar" />);
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      render(<Avatar name="Test" aria-label="User profile" />);
      expect(screen.getByLabelText('User profile')).toBeInTheDocument();
    });

    it('should pass through role attribute', () => {
      render(<Avatar name="Test" role="img" />);
      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      const { container } = render(<Avatar name="Test" id="user-avatar" />);
      const avatar = container.querySelector('#user-avatar');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should combine size and className', () => {
      const { container } = render(<Avatar name="Test" size="lg" className="custom" />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass('w-12');
      expect(avatar).toHaveClass('custom');
    });

    it('should handle all props together', () => {
      render(
        <Avatar
          name="John Doe"
          size="xl"
          className="border-2"
          data-testid="full-avatar"
          aria-label="User profile"
        />
      );
      const avatar = screen.getByTestId('full-avatar');
      expect(avatar).toHaveClass('w-16');
      expect(avatar).toHaveClass('border-2');
      expect(screen.getByLabelText('User profile')).toBeInTheDocument();
    });

    it('should prioritize src over name', () => {
      render(<Avatar src="/avatar.png" name="John Doe" />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      // Should show image, not initials
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });
  });

  describe('Initials Generation', () => {
    it('should handle names with multiple spaces', () => {
      render(<Avatar name="John  Doe" />); // Double space
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle names with leading/trailing spaces', () => {
      render(<Avatar name="  John Doe  " />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle three-word names', () => {
      render(<Avatar name="John Middle Doe" />);
      // Should use first and last
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle lowercase names', () => {
      render(<Avatar name="john doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should handle mixed case names', () => {
      render(<Avatar name="jOhN dOe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined name gracefully', () => {
      render(<Avatar name={undefined} />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should handle null src gracefully', () => {
      render(<Avatar src={undefined} name="Test User" />);
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('should handle empty src string', () => {
      render(<Avatar src="" name="Test User" />);
      // Empty string is falsy, should show initials
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      render(<Avatar name="José García" />);
      expect(screen.getByText('JG')).toBeInTheDocument();
    });

    it('should handle single character name', () => {
      render(<Avatar name="X" />);
      expect(screen.getByText('X')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as an image when src is provided', () => {
      render(<Avatar src="/avatar.png" alt="User profile picture" />);
      const img = screen.getByRole('img', { name: 'User profile picture' });
      expect(img).toBeInTheDocument();
    });

    it('should support aria-label for screen readers', () => {
      render(<Avatar name="Test" aria-label="Profile picture" />);
      expect(screen.getByLabelText('Profile picture')).toBeInTheDocument();
    });

    it('should have meaningful alt text on images', () => {
      render(<Avatar src="/avatar.png" name="Jane Doe" />);
      const img = screen.getByAltText('Jane Doe');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain consistent border radius across sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

      sizes.forEach(size => {
        const { container } = render(<Avatar name="Test" size={size} />);
        const avatar = container.firstChild as HTMLElement;
        expect(avatar).toHaveClass('rounded-full');
      });
    });

    it('should maintain consistent overflow across all variants', () => {
      // With image
      const { container: container1 } = render(<Avatar src="/test.png" />);
      expect(container1.firstChild).toHaveClass('overflow-hidden');

      // With initials
      const { container: container2 } = render(<Avatar name="Test" />);
      expect(container2.firstChild).toHaveClass('overflow-hidden');
    });
  });
});
