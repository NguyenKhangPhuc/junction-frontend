import { NavigationBarClient } from './NavigationBarClient';
import { NavigationBarMobile } from './NavigationBarMobile';
import { NavItem } from './types';

const defaultNavItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/about' },
];

interface NavigationBarServerProps {
  items?: NavItem[];
  projectName?: string;
}

export function NavigationBarServer({
  items = defaultNavItems,
  projectName = 'Pohjola Post',
}: NavigationBarServerProps) {
  return (
    <>
      <NavigationBarClient items={items} projectName={projectName} />
      <NavigationBarMobile items={items} projectName={projectName} />
    </>
  );
}

export default NavigationBarServer;
