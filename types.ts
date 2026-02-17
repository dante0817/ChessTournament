export interface Prize {
  rank: string;
  amount: string;
  icon?: string;
  isSpecial?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface SpecialPrize {
  title: string;
  amount: string;
}