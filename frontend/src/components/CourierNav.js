import { NavLink } from 'react-router-dom';

const tabs = [
  {
    to: '/courier', label: 'Teslimatlar',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    to: '/courier/profile', label: 'Profil',
    icon: (active) => (
      <svg className={`w-6 h-6 ${active ? 'text-red-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function CourierNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map(tab => (
        <NavLink key={tab.to} to={tab.to} end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2.5 gap-0.5 transition ${isActive ? 'text-red-600' : 'text-gray-400'}`
          }>
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span className={`text-xs font-medium ${isActive ? 'text-red-600' : 'text-gray-400'}`}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
