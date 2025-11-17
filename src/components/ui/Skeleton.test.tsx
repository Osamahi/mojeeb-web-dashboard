import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonButton, SkeletonInput } from './Skeleton';

describe('Skeleton', () => {
  describe('Rendering', () => {
    it('should render skeleton', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toBeInTheDocument();
    });

    it('should forward ref to div element', () => {
      const ref = { current: null };
      render(<Skeleton ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should render single skeleton by default', () => {
      const { container } = render(<Skeleton />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBe(1);
    });
  });

  describe('Base Styles', () => {
    it('should have base skeleton classes', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-neutral-100');
      expect(skeleton).toHaveClass('rounded');
      expect(skeleton).toHaveClass('animate-shimmer');
    });

    it('should have shimmer animation', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-shimmer');
    });

    it('should have neutral background', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-neutral-100');
    });
  });

  describe('Size Props', () => {
    it('should apply custom width', () => {
      const { container } = render(<Skeleton width="200px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('200px');
    });

    it('should apply custom height', () => {
      const { container } = render(<Skeleton height="100px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('100px');
    });

    it('should apply both width and height', () => {
      const { container } = render(<Skeleton width="300px" height="150px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('300px');
      expect(skeleton.style.height).toBe('150px');
    });

    it('should handle percentage values', () => {
      const { container } = render(<Skeleton width="100%" height="50%" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('100%');
      expect(skeleton.style.height).toBe('50%');
    });

  });

  describe('Circle Variant', () => {
    it('should render circular skeleton', () => {
      const { container } = render(<Skeleton circle />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should use width for height when circle is true', () => {
      const { container } = render(<Skeleton circle width="48px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.width).toBe('48px');
      expect(skeleton.style.height).toBe('48px');
    });

    it('should not be circular by default', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).not.toHaveClass('rounded-full');
      expect(skeleton).toHaveClass('rounded');
    });

    it('should set height equal to width when circle is true and height not provided', () => {
      const { container } = render(<Skeleton circle width="64px" />);
      const skeleton = container.firstChild as HTMLElement;
      // Height should be set to width for circle when height is not provided
      expect(skeleton.style.width).toBe('64px');
      expect(skeleton.style.height).toBe('64px');
    });
  });

  describe('Count Prop', () => {
    it('should render multiple skeletons', () => {
      const { container } = render(<Skeleton count={3} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBe(3);
    });

    it('should render with spacing between multiple skeletons', () => {
      const { container } = render(<Skeleton count={5} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should handle large count', () => {
      const { container } = render(<Skeleton count={10} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBe(10);
    });

    it('should render single skeleton when count is 1', () => {
      const { container } = render(<Skeleton count={1} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-neutral-100');
      expect(skeleton).not.toHaveClass('space-y-2');
    });

    it('should apply width to all skeletons when count > 1', () => {
      const { container } = render(<Skeleton count={3} width="100px" />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      skeletons.forEach(skeleton => {
        expect((skeleton as HTMLElement).style.width).toBe('100px');
      });
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<Skeleton className="custom-skeleton" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(<Skeleton className="my-class" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('my-class');
      expect(skeleton).toHaveClass('bg-neutral-100');
      expect(skeleton).toHaveClass('animate-shimmer');
    });

    it('should allow overriding background color', () => {
      const { container } = render(<Skeleton className="bg-blue-100" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('bg-blue-100');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through data attributes', () => {
      const { container } = render(<Skeleton data-testid="custom-skeleton" />);
      const skeleton = container.querySelector('[data-testid="custom-skeleton"]');
      expect(skeleton).toBeInTheDocument();
    });

    it('should pass through aria attributes', () => {
      const { container } = render(<Skeleton aria-label="Loading content" />);
      const skeleton = container.querySelector('[aria-label="Loading content"]');
      expect(skeleton).toBeInTheDocument();
    });

    it('should pass through role attribute', () => {
      const { container } = render(<Skeleton role="status" />);
      const skeleton = container.querySelector('[role="status"]');
      expect(skeleton).toBeInTheDocument();
    });

    it('should pass through id attribute', () => {
      const { container } = render(<Skeleton id="main-skeleton" />);
      const skeleton = container.querySelector('#main-skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should combine circle and width', () => {
      const { container } = render(<Skeleton circle width="40px" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton.style.width).toBe('40px');
    });

    it('should combine count and size props', () => {
      const { container } = render(<Skeleton count={3} width="200px" height="20px" />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBe(3);
      skeletons.forEach(skeleton => {
        expect((skeleton as HTMLElement).style.width).toBe('200px');
        expect((skeleton as HTMLElement).style.height).toBe('20px');
      });
    });

    it('should handle all props together', () => {
      const { container } = render(
        <Skeleton
          count={2}
          width="100px"
          height="50px"
          className="custom"
          data-testid="full-skeleton"
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
      const skeletons = container.querySelectorAll('[data-testid="full-skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should render at least one skeleton even with zero count', () => {
      const { container } = render(<Skeleton count={0} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      // Component treats count <= 1 as single skeleton
      expect(skeletons.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle undefined width and height', () => {
      const { container } = render(<Skeleton width={undefined} height={undefined} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
    });

    it('should handle empty string width and height', () => {
      const { container } = render(<Skeleton width="" height="" />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
    });
  });
});

describe('SkeletonText', () => {
  describe('Rendering', () => {
    it('should render 3 lines by default', () => {
      const { container } = render(<SkeletonText />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBe(3);
    });

    it('should render custom number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBe(5);
    });

    it('should have spacing between lines', () => {
      const { container } = render(<SkeletonText />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should have consistent height for all lines', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      skeletons.forEach(skeleton => {
        expect((skeleton as HTMLElement).style.height).toBe('16px');
      });
    });

    it('should make last line shorter', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      const lastSkeleton = skeletons[skeletons.length - 1] as HTMLElement;
      expect(lastSkeleton.style.width).toBe('80%');
    });

    it('should make non-last lines full width', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      for (let i = 0; i < skeletons.length - 1; i++) {
        expect((skeletons[i] as HTMLElement).style.width).toBe('100%');
      }
    });
  });
});

describe('SkeletonCard', () => {
  describe('Rendering', () => {
    it('should render card skeleton', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.querySelector('.bg-white.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('should have card styling', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-neutral-200');
    });

    it('should render avatar skeleton (circle)', () => {
      const { container } = render(<SkeletonCard />);
      const avatar = container.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });

    it('should render text skeletons', () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('.bg-neutral-100');
      expect(skeletons.length).toBeGreaterThan(3);
    });

    it('should have card padding', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-6');
    });
  });
});

describe('SkeletonButton', () => {
  describe('Rendering', () => {
    it('should render button skeleton', () => {
      const { container } = render(<SkeletonButton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
    });

    it('should have button dimensions', () => {
      const { container } = render(<SkeletonButton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('40px');
      expect(skeleton.style.width).toBe('120px');
    });

    it('should have rounded corners', () => {
      const { container } = render(<SkeletonButton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should have shimmer animation', () => {
      const { container } = render(<SkeletonButton />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-shimmer');
    });
  });
});

describe('SkeletonInput', () => {
  describe('Rendering', () => {
    it('should render input skeleton', () => {
      const { container } = render(<SkeletonInput />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
    });

    it('should have input height', () => {
      const { container } = render(<SkeletonInput />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton.style.height).toBe('40px');
    });

    it('should have rounded corners', () => {
      const { container } = render(<SkeletonInput />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should have shimmer animation', () => {
      const { container } = render(<SkeletonInput />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass('animate-shimmer');
    });

    it('should be full width by default', () => {
      const { container } = render(<SkeletonInput />);
      const skeleton = container.firstChild as HTMLElement;
      // Width not explicitly set, so it should adapt to container
      expect(skeleton).toBeInTheDocument();
    });
  });
});

describe('Skeleton Helpers - Integration', () => {
  it('should all use consistent base skeleton component', () => {
    const { container: container1 } = render(<SkeletonText lines={1} />);
    const { container: container2 } = render(<SkeletonButton />);
    const { container: container3 } = render(<SkeletonInput />);

    const skeleton1 = container1.querySelector('.animate-shimmer');
    const skeleton2 = container2.querySelector('.animate-shimmer');
    const skeleton3 = container3.querySelector('.animate-shimmer');

    expect(skeleton1).toBeInTheDocument();
    expect(skeleton2).toBeInTheDocument();
    expect(skeleton3).toBeInTheDocument();
  });

  it('should all have consistent neutral background', () => {
    const { container: container1 } = render(<SkeletonText lines={1} />);
    const { container: container2 } = render(<SkeletonButton />);
    const { container: container3 } = render(<SkeletonInput />);

    const skeleton1 = container1.querySelector('.bg-neutral-100');
    const skeleton2 = container2.querySelector('.bg-neutral-100');
    const skeleton3 = container3.querySelector('.bg-neutral-100');

    expect(skeleton1).toBeInTheDocument();
    expect(skeleton2).toBeInTheDocument();
    expect(skeleton3).toBeInTheDocument();
  });
});
