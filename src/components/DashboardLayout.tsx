'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/loan-applications', icon: 'bi-speedometer2', label: 'Loan Applications' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleHamburgerClick() {
    if (window.innerWidth <= 992) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <div className={collapsed ? 'sidebar-collapsed' : ''}>
      <aside className={`sidebar ${mobileOpen ? 'show' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="32" height="32" rx="8" fill="#556ee6" />
              <path d="M18 8L26 16H22V28H14V16H10L18 8Z" fill="white" opacity="0.9" />
              <circle cx="18" cy="18" r="3" fill="white" opacity="0.5" />
            </svg>
          </div>
          <h3>
            <span>L</span>oan Platform
          </h3>
        </div>

        <div className="sidebar-menu">
          <div className="menu-title">Main</div>
          {navItems.map((item) => (
            <div className="nav-item" key={item.href}>
              <Link
                href={item.href}
                className={`nav-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </aside>

      {mobileOpen && (
        <div className="sidebar-overlay show" onClick={() => setMobileOpen(false)} />
      )}

      <div className="main-content">
        <header className="header">
          <button className="hamburger" onClick={handleHamburgerClick}>
            <i className="bi bi-list"></i>
          </button>

          <div className="header-search">
            <input type="text" placeholder="Search..." className="form-control" />
          </div>

          <div className="header-right">
            <div className="user-profile dropdown">
              <a
                href="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                className="d-flex align-items-center text-decoration-none"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'User')}&background=556ee6&color=fff`}
                  alt="User"
                />
                <div className="ms-2 d-none d-md-block">
                  <div className="user-name">{user?.name}</div>
                  <div className="user-role">{user?.role}</div>
                </div>
              </a>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-custom">
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}