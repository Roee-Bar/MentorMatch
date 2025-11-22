import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  describe('Structure and Layout', () => {
    it('should render the footer element', () => {
      const { container } = render(<Footer />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should have correct styling classes', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-gray-50', 'border-t', 'border-gray-200');
    });

    it('should render three column sections', () => {
      render(<Footer />);
      expect(screen.getByText('MentorMatch')).toBeInTheDocument();
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });
  });

  describe('About Section (Column 1)', () => {
    it('should render MentorMatch heading', () => {
      render(<Footer />);
      expect(screen.getByText('MentorMatch')).toBeInTheDocument();
    });

    it('should display the description text', () => {
      render(<Footer />);
      expect(screen.getByText(/streamlining the supervisor-student matching process/i)).toBeInTheDocument();
    });

    it('should have correct heading styling', () => {
      render(<Footer />);
      const heading = screen.getByText('MentorMatch');
      expect(heading.tagName).toBe('H3');
      expect(heading).toHaveClass('text-base', 'font-bold', 'text-gray-800');
    });
  });

  describe('Quick Links Section (Column 2)', () => {
    it('should render Quick Links heading', () => {
      render(<Footer />);
      expect(screen.getByText('Quick Links')).toBeInTheDocument();
    });

    it('should render all three quick links', () => {
      render(<Footer />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      const aboutLink = screen.getByRole('link', { name: /about/i });
      const helpLink = screen.getByRole('link', { name: /help/i });

      expect(homeLink).toBeInTheDocument();
      expect(aboutLink).toBeInTheDocument();
      expect(helpLink).toBeInTheDocument();
    });

    it('should have correct href for Home link', () => {
      render(<Footer />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should have correct href for About link', () => {
      render(<Footer />);
      const aboutLink = screen.getByRole('link', { name: /about/i });
      expect(aboutLink).toHaveAttribute('href', '#');
    });

    it('should have correct href for Help link', () => {
      render(<Footer />);
      const helpLink = screen.getByRole('link', { name: /help/i });
      expect(helpLink).toHaveAttribute('href', '#');
    });

    it('should apply correct link styling', () => {
      render(<Footer />);
      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveClass('text-sm', 'text-blue-600', 'no-underline', 'hover:underline');
    });
  });

  describe('Contact Section (Column 3)', () => {
    it('should render Contact heading', () => {
      render(<Footer />);
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should display Braude College of Engineering', () => {
      render(<Footer />);
      expect(screen.getByText('Braude College of Engineering')).toBeInTheDocument();
    });

    it('should display college address', () => {
      render(<Footer />);
      expect(screen.getByText('Snunit St 51, Karmiel')).toBeInTheDocument();
    });

    it('should display support email', () => {
      render(<Footer />);
      expect(screen.getByText('support@mentormatch.ac.il')).toBeInTheDocument();
    });

    it('should apply correct email styling', () => {
      render(<Footer />);
      const email = screen.getByText('support@mentormatch.ac.il');
      expect(email).toHaveClass('text-sm', 'text-blue-600');
    });
  });

  describe('Copyright Section', () => {
    it('should render copyright notice', () => {
      render(<Footer />);
      expect(screen.getByText(/© 2024 MentorMatch - Braude College of Engineering/i)).toBeInTheDocument();
    });

    it('should include "All rights reserved" text', () => {
      render(<Footer />);
      expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
    });

    it('should have copyright section with correct styling', () => {
      render(<Footer />);
      const copyright = screen.getByText(/© 2024 MentorMatch/i);
      expect(copyright).toHaveClass('text-sm', 'text-gray-500');
    });

    it('should have border separator above copyright', () => {
      const { container } = render(<Footer />);
      const copyrightContainer = screen.getByText(/© 2024 MentorMatch/i).parentElement;
      expect(copyrightContainer).toHaveClass('border-t', 'border-gray-200', 'pt-5', 'text-center');
    });
  });

  describe('Accessibility', () => {
    it('should render as semantic footer element', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
      expect(footer?.tagName).toBe('FOOTER');
    });

    it('should have proper heading hierarchy', () => {
      render(<Footer />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(3);
      expect(headings[0]).toHaveTextContent('MentorMatch');
      expect(headings[1]).toHaveTextContent('Quick Links');
      expect(headings[2]).toHaveTextContent('Contact');
    });

    it('should render unordered list for quick links', () => {
      const { container } = render(<Footer />);
      const lists = container.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should have accessible link text', () => {
      render(<Footer />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});

