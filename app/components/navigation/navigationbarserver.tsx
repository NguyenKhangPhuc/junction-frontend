import { NavigationBarClient } from './NavigationBarClient';
import { NavigationBarMobile } from './NavigationBarMobile';
import { NavItem } from './types';

// Default news navigation items requested: Home (/), News (/news), About (/about)
const defaultNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'News', href: '/news', badge: 'Hot' },
  { label: 'About', href: '/about' },
];

interface NavigationBarServerProps {
  items?: NavItem[];
  projectName?: string;
  tagline?: string;
}

export function NavigationBarServer({
  items = defaultNavItems,
  projectName = 'KoJaPu',
  tagline = 'News & Editorial Insights',
}: NavigationBarServerProps) {
  return (
    <header role="banner" className="w-full">
      {/* Desktop & Tablet Navigation */}
      <NavigationBarClient
        items={items}
        projectName={projectName}
        tagline={tagline}
      />

      {/* Mobile Top Header and Bottom Navigation Bar */}
      <NavigationBarMobile
        items={items}
        projectName={projectName}
      />
    </header>
  );
}

export default NavigationBarServer;
