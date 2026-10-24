export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavigationProps {
  items: NavItem[];
  projectName?: string;
  tagline?: string;
}
