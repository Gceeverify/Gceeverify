'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCheck,
  CircleDollarSign,
  PackageCheck,
  RadioTower,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const notifications = [
  {
    id: 'vtu-live',
    title: 'VTU services are ready',
    detail: 'Buy airtime, data and pay everyday bills.',
    time: 'Just now',
    href: '/vtu',
    icon: RadioTower,
  },
  {
    id: 'order-complete',
    title: 'Order completed',
    detail: 'Instagram Followers · #GC-24819',
    time: '12 min ago',
    href: '/#dashboard',
    icon: PackageCheck,
  },
  {
    id: 'wallet',
    title: 'Wallet reminder',
    detail: 'Add funds to keep your next order moving.',
    time: '1 hr ago',
    href: '/#dashboard',
    icon: CircleDollarSign,
  },
];

export function NotificationMenu() {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const unreadCount = notifications.length - readIds.size;

  const markRead = (id: string) =>
    setReadIds((current) => new Set(current).add(id));
  const markAllRead = () =>
    setReadIds(new Set(notifications.map(({ id }) => id)));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="icon-button notification-trigger"
        aria-label={
          unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
      >
        <Bell />
        {unreadCount ? (
          <span className="notification-dot">{unreadCount}</span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="notification-menu"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="notification-menu-head">
            <span>
              <strong>Notifications</strong>
              <small>
                {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
              </small>
            </span>
            <button type="button" onClick={markAllRead} disabled={!unreadCount}>
              <CheckCheck /> Mark all read
            </button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="notification-list">
            {notifications.map(
              ({ id, title, detail, time, href, icon: Icon }) => {
                const isRead = readIds.has(id);
                return (
                  <DropdownMenuItem
                    key={id}
                    className={`notification-item ${isRead ? 'notification-item-read' : ''}`}
                    onClick={() => {
                      markRead(id);
                      window.location.assign(href);
                    }}
                  >
                    <span className="notification-item-icon">
                      <Icon />
                    </span>
                    <span className="notification-item-copy">
                      <strong>{title}</strong>
                      <span>{detail}</span>
                      <small>{time}</small>
                    </span>
                    {isRead ? null : <i aria-label="Unread" />}
                  </DropdownMenuItem>
                );
              },
            )}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
