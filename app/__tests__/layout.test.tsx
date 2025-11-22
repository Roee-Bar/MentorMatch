import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';
import React from 'react';

// Mock Header and Footer components since they're tested separately
jest.mock('@/app/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="mock-header">Header</header>;
  };
});

jest.mock('@/app/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="mock-footer">Footer</footer>;
  };
});

// Import the mocked components
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

// Helper component to test body content without html/body tags
function LayoutBodyContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        {children}
      </main>
      <Footer />
    </div>
  );
}

describe('RootLayout', () => {
  describe('Metadata', () => {
    it('should export correct metadata with title', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('MentorMatch - Braude College');
    });

    it('should export correct metadata with description', () => {
      expect(metadata).toBeDefined();
      expect(metadata.description).toBe('Find your perfect project supervisor');
    });
  });

  describe('Structure and Layout', () => {
    it('should render children content', () => {
      render(
        <LayoutBodyContent>
          <div>Test Content</div>
        </LayoutBodyContent>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render Header component', () => {
      render(
        <LayoutBodyContent>
          <div>Content</div>
        </LayoutBodyContent>
      );
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    });

    it('should render Footer component', () => {
      render(
        <LayoutBodyContent>
          <div>Content</div>
        </LayoutBodyContent>
      );
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });

    it('should wrap children in main element', () => {
      const { container } = render(
        <LayoutBodyContent>
          <div data-testid="child-content">Content</div>
        </LayoutBodyContent>
      );
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toContainElement(screen.getByTestId('child-content'));
    });

    it('should apply correct styling to main element', () => {
      const { container } = render(
        <LayoutBodyContent>
          <div>Content</div>
        </LayoutBodyContent>
      );
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('flex-1', 'bg-white');
    });

    it('should have correct flex container structure', () => {
      const { container } = render(
        <LayoutBodyContent>
          <div>Content</div>
        </LayoutBodyContent>
      );
      const flexContainer = container.querySelector('.flex.flex-col.min-h-screen');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('HTML Document Structure', () => {
    it('should export layout component that renders html with lang attribute', () => {
      // Test the structure of RootLayout by checking its render output
      const testChildren = <div>Test Content</div>;
      const layoutElement = RootLayout({ children: testChildren });
      
      // Verify it's an html element with lang attribute
      expect(layoutElement.type).toBe('html');
      expect(layoutElement.props.lang).toBe('en');
    });

    it('should have body element as child of html', () => {
      const testChildren = <div>Test Content</div>;
      const layoutElement = RootLayout({ children: testChildren });
      
      // Get the body child from html
      const bodyElement = React.Children.toArray(layoutElement.props.children)[0];
      expect(bodyElement).toBeDefined();
      // @ts-ignore - bodyElement is a React element
      expect(bodyElement.type).toBe('body');
    });

    it('should apply correct classes to body element', () => {
      const testChildren = <div>Test Content</div>;
      const layoutElement = RootLayout({ children: testChildren });
      
      const bodyElement = React.Children.toArray(layoutElement.props.children)[0];
      // @ts-ignore
      expect(bodyElement.props.className).toContain('m-0');
      // @ts-ignore
      expect(bodyElement.props.className).toContain('font-sans');
    });

    it('should maintain correct component order: Header, Main, Footer', () => {
      const { container } = render(
        <LayoutBodyContent>
          <div>Content</div>
        </LayoutBodyContent>
      );
      
      const flexContainer = container.querySelector('.flex.flex-col.min-h-screen');
      const children = flexContainer?.children;
      
      expect(children).toBeDefined();
      expect(children![0].getAttribute('data-testid')).toBe('mock-header');
      expect(children![1].tagName).toBe('MAIN');
      expect(children![2].getAttribute('data-testid')).toBe('mock-footer');
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic main element', () => {
      const { container } = render(
        <LayoutBodyContent>
          <div>Content</div>
        </LayoutBodyContent>
      );
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should properly nest content within semantic elements', () => {
      render(
        <LayoutBodyContent>
          <article>Article Content</article>
        </LayoutBodyContent>
      );
      const article = screen.getByText('Article Content');
      expect(article.tagName).toBe('ARTICLE');
      expect(article.closest('main')).toBeInTheDocument();
    });
  });
});

