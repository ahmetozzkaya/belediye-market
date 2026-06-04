import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/courier', label: 'Teslimatlar', icon: '🛵' },
  { to: '/courier/profile', label: 'Profil', icon: '👤' },
];

export default function CourierNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 shadow-lg">
      {tabs.map(tab => (
        <NavLink key={tab.to} to={tab.to} end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs font-medium transition ${
              isActive ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
            }`
          }>
          <span className="text-xl mb-0.5">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
