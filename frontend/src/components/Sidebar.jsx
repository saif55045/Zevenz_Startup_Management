import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, isActive } = useAuth();

    const activeNavItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '◈' },
        { path: '/activity', label: 'Daily Activity', icon: '◉' },
        { path: '/plans', label: 'Plans', icon: '◫' },
        { path: '/attendance', label: 'Attendance', icon: '◧' },
        { path: '/reactivation', label: 'Reactivation', icon: '↻' },
        { path: '/chat', label: 'Group Chat', icon: '◬' },
        { path: '/founders', label: 'Founders', icon: '◎' }
    ];

    const outNavItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '◈' },
        { path: '/attendance', label: 'Attendance', icon: '◧' },
        { path: '/reactivation', label: 'Reactivation', icon: '↻' },
        { path: '/chat', label: 'Group Chat', icon: '◬' }
    ];

    const navItems = isActive ? activeNavItems : outNavItems;
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="sidebar-logo-icon">Z</span>
                    <span>Zevenz</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Menu</div>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/profile" className="sidebar-user sidebar-user-link">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="sidebar-user-avatar-img" />
                    ) : (
                        <div className="sidebar-user-avatar">{initials}</div>
                    )}
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.name}</span>
                        <span className={`badge badge-${user?.status?.toLowerCase()} sidebar-user-status`}>
                            {user?.status}
                        </span>
                    </div>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
