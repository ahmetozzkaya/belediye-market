import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  {
    to: '/', label: 'Keşfet',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/orders', label: 'Siparişler',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/profile', label: 'Profil',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function CustomerNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map(tab => {
        const isActive = tab.to === '/'
          ? location.pathname === '/' || location.pathname.startsWith('/restaurant')
          : location.pathname.startsWith(tab.to);
        return (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition">
            {tab.icon(isActive)}
            <span className={`text-xs font-medium transition ${isActive ? 'text-red-600' : 'text-gray-400'}`}>
              {tab.label}
            </span>
            {isActive && <span className="absolute bottom-0 w-8 h-0.5 bg-red-600 rounded-full" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
