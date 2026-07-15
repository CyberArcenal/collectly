// src/renderer/layouts/Sidebar/hooks/useMenuItems.ts
import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  HelpCircle,
  ListChecks,
  CalendarDays,
  Users2,
  FileCheck,
  Receipt,
  FileBarChart,
  Sliders,
  FileText,
  HandCoins,
  Landmark,
  AlertTriangle,
  Target,
  Clock,
  CreditCard,
  FileSignature,
  ChartNoAxesCombined,
  Layers,
  Upload,
  Calendar,
  UserCog,
} from 'lucide-react';
import type { MenuItem } from '../types';
import type { UserRole } from '../../../contexts/AuthContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';

// Define which menu items should be hidden in offline mode
const OFFLINE_HIDDEN_PATHS = ['/users', '/sync']; // User Management and Sync are not available offline

const MENU_ITEMS: MenuItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    category: 'core',
    roles: ['admin', 'manager', 'collector', 'staff', 'viewer'],
  },
  {
    path: '/debtors',
    name: 'Debtors',
    icon: Users,
    category: 'core',
    roles: ['admin', 'manager', 'collector', 'staff'],
    children: [
      {
        path: '/debtors/list',
        name: 'Debtor Directory',
        icon: Users2,
        roles: ['admin', 'manager', 'collector', 'staff'],
      },
      {
        path: '/debtors/credit-check',
        name: 'Credit Checks',
        icon: FileCheck,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/debtors/group',
        name: 'Groups / Segments',
        icon: Layers,
        roles: ['admin', 'manager'],
      },
    ],
  },
  {
    path: '/loans',
    name: 'Loans & Debts',
    icon: HandCoins,
    category: 'core',
    roles: ['admin', 'manager', 'collector', 'staff'],
    children: [
      {
        path: '/loans/active',
        name: 'Active Loans',
        icon: Clock,
        roles: ['admin', 'manager', 'collector', 'staff'],
      },
      {
        path: '/loans/overdue',
        name: 'Overdue Accounts',
        icon: AlertTriangle,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/loans/closed',
        name: 'Closed / Paid',
        icon: FileCheck,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/loans/applications',
        name: 'Loan Applications',
        icon: FileSignature,
        roles: ['admin', 'manager'],
      },
      {
        path: '/loans/agreements',
        name: 'Loan Agreements',
        icon: FileText,
        roles: ['admin', 'manager', 'staff'],
      },
    ],
  },
  {
    path: '/payments',
    name: 'Collections',
    icon: Landmark,
    category: 'core',
    roles: ['admin', 'manager', 'collector', 'staff'],
    children: [
      {
        path: '/payments/collection',
        name: 'Collection Schedule',
        icon: Calendar,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/payments/schedule',
        name: 'Payment Schedule',
        icon: CalendarDays,
        roles: ['admin', 'manager', 'collector', 'staff'],
      },
      {
        path: '/payments/plan',
        name: 'Payment Plan',
        icon: Calendar,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/payments/transactions',
        name: 'Transaction Log',
        icon: Receipt,
        roles: ['admin', 'manager', 'collector', 'staff'],
      },
      {
        path: '/payments/methods',
        name: 'Payment Methods',
        icon: CreditCard,
        roles: ['admin', 'manager'],
      },
      {
        path: '/notification-logs',
        name: 'Reminders',
        icon: Bell,
        roles: ['admin', 'manager', 'collector'],
      },
    ],
  },
  {
    path: '/reports',
    name: 'Reports',
    icon: FileBarChart,
    category: 'analytics',
    roles: ['admin', 'manager', 'collector'],
    children: [
      {
        path: '/reports/aging',
        name: 'Aging Analysis',
        icon: Clock,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/reports/collection',
        name: 'Collection Report',
        icon: ChartNoAxesCombined,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/reports/debtor-stmt',
        name: 'Debtor Statement',
        icon: FileText,
        roles: ['admin', 'manager', 'collector'],
      },
      {
        path: '/reports/expected',
        name: 'Expected Payments',
        icon: Target,
        roles: ['admin', 'manager', 'collector'],
      },
    ],
  },
  {
    path: '/users',
    name: 'User Management',
    icon: UserCog,
    category: 'system',
    roles: ['admin'],
  },
  {
    path: '/system',
    name: 'System',
    icon: Settings,
    category: 'system',
    roles: ['admin', 'manager'],
    children: [
      {
        path: '/system/audit',
        name: 'Audit Trail',
        icon: ListChecks,
        roles: ['admin', 'manager'],
      },
      {
        path: '/sync',
        name: 'Data Sync',
        icon: Upload,
        roles: ['admin', 'manager'],
      },
      {
        path: '/system/settings',
        name: 'System Settings',
        icon: Sliders,
        roles: ['admin', 'manager'],
      },
    ],
  },
];

export const useMenuItems = () => {
  const { user, hasRole } = useAuth();
  const { isOfflineMode } = useSettings();

  const filteredMenuItems = useMemo(() => {
    // If offline mode, show all items EXCEPT those that are explicitly hidden offline
    if (isOfflineMode()) {
      // Filter out items that are marked as hidden offline
      const filterOfflineHidden = (items: MenuItem[]): MenuItem[] => {
        return items
          .map((item) => {
            // Check if this item or any of its children should be hidden
            if (OFFLINE_HIDDEN_PATHS.includes(item.path)) {
              return null;
            }

            // Filter children recursively
            let filteredChildren: MenuItem[] | undefined;
            if (item.children) {
              filteredChildren = filterOfflineHidden(item.children);
              if (filteredChildren.length === 0) {
                return null;
              }
            }

            return {
              ...item,
              children: filteredChildren,
            };
          })
          .filter(Boolean) as MenuItem[];
      };

      return filterOfflineHidden(MENU_ITEMS);
    }

    // If online mode, filter by role
    const filterByRole = (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          // Check if user has access to this item
          if (item.roles && !hasRole(item.roles)) {
            return null;
          }

          // Filter children
          let filteredChildren: MenuItem[] | undefined;
          if (item.children) {
            filteredChildren = filterByRole(item.children);
            if (filteredChildren.length === 0) {
              return null;
            }
          }

          return {
            ...item,
            children: filteredChildren,
          };
        })
        .filter(Boolean) as MenuItem[];
    };

    return filterByRole(MENU_ITEMS);
  }, [hasRole, isOfflineMode]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {
      core: [],
      analytics: [],
      system: [],
    };

    filteredMenuItems.forEach((item) => {
      if (item.category && groups[item.category]) {
        groups[item.category].push(item);
      } else {
        // Default to core if no category
        groups.core.push(item);
      }
    });

    return groups;
  }, [filteredMenuItems]);

  return {
    menuItems: filteredMenuItems,
    groupedItems,
    categories: [
      { id: 'core', name: 'Debt Management' },
      { id: 'analytics', name: 'Reports & Insights' },
      { id: 'system', name: 'System' },
    ].filter((cat) => groupedItems[cat.id as keyof typeof groupedItems]?.length > 0),
  };
};