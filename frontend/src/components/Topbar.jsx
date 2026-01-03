import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const Topbar = ({ title }) => {
    const { logout } = useAuth();

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h2 className="topbar-title">{title}</h2>
            </div>

            <div className="topbar-right">
                <button className="topbar-btn" onClick={logout}>
                    Sign out
                </button>
            </div>
        </header>
    );
};

export default Topbar;
