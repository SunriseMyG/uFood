import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaUser, FaSignOutAlt } from "react-icons/fa";
import type { userData } from '../../users';
import './Header.css'

interface HeaderProps {
    user: userData | null;
    setUser: React.Dispatch<React.SetStateAction<userData | null>>;
    onSearch?: (query: string) => void;
    availableGenres?: string[];
    filters?: any;
    onFiltersChange?: (filters: any) => void;
    onClearFilters?: () => void;
    showSearchBar?: boolean;
    currentPage?: string;
}

function Header({
    user,
    setUser,
    onSearch,
    showSearchBar = true
}: HeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    console.log("User in Header:", user);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        closeMenu();
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        closeMenu();
        navigate('/');
        console.log('Utilisateur déconnecté');
    };

    const shouldShowSearch = showSearchBar && (
        location.pathname === '/' ||
        location.pathname.includes('/restaurant')
    );

    return (
        <header className="header">
            <nav className="header-nav">
                <div className="logo-section">
                    <span className="logo-text" onClick={() => handleNavigation('/')}>UFood</span>
                </div>

                {shouldShowSearch && (
                    <form className="nav-desktop search-bar" onSubmit={(e) => e.preventDefault()}>
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e: any) => {
                                setSearchQuery(e.target.value);
                                if (onSearch) onSearch(e.target.value);
                            }}
                        />
                    </form>
                )}


                <div className="nav-desktop login-button">
                    {user ? (
                        <div className="user-dropdown">
                            <button
                                className="nav-button"
                                onClick={() => handleNavigation('/profil')}
                            >
                                <FaUser className="dropdown-icon" />
                                {user.name}
                            </button>
                            <div className="dropdown-divider"></div>
                            <button
                                className="nav-button logout"
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt className="dropdown-icon" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button className="nav-button" onClick={() => handleNavigation('/login')}>
                            Login
                        </button>
                    )}
                </div>

                <button className={`hamburger ${menuOpen ? 'hamburger-open' : ''}`} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav>

            <div className={`nav-mobile ${menuOpen ? 'nav-mobile-open' : ''}`}>
                <div className="nav-mobile-content">
                    {shouldShowSearch && (
                        <form className="mobile-search-bar" onSubmit={(e) => e.preventDefault()}>
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="mobile-search-input"
                                value={searchQuery}
                                onChange={(e: any) => {
                                    setSearchQuery(e.target.value);
                                    if (onSearch) onSearch(e.target.value);
                                }}
                            />
                        </form>
                    )}
                    <button className="nav-button-mobile" onClick={() => handleNavigation('/')}>
                        Restaurants
                    </button>
                    {user ? (
                        <>
                            <div className="mobile-user-info">
                                <span>Connected as {user.name}</span>
                            </div>
                            <button className="nav-button-mobile" onClick={() => handleNavigation('/profil')}>
                                Profile
                            </button>
                            <button className="nav-button-mobile logout" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="nav-button-mobile" onClick={() => handleNavigation('/login')}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header