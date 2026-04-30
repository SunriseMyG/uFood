import './app.css'
import {useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate, useLocation} from 'react-router-dom';
import type { userData } from './users';
import { apiService } from './api/service.ts';

// Components
import Header from './components/header/Header'

// Pages
import Restaurants from './pages/Home/Home';
import User from './pages/User/User';
import Maintenance from './pages/Maintenance/Maintenance';
import Login from './pages/Login/Login';
import Loading from './components/loading/loading';
import RestaurantDetails from './pages/RestaurantDetails/RestaurantDetails';
import FavoriteListPage from "./pages/List/List.tsx";


function AppContent() {
    const [user, setUser] = useState<userData | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const location = useLocation();

    useEffect(() => {
        const loadUserFromStorage = () => {
            try {
                const token = localStorage.getItem('authToken');
                const storedUserData = localStorage.getItem('userData');

                if (token && storedUserData) {
                    const parsedUserData: userData = JSON.parse(storedUserData);
                    if (parsedUserData.token === token) {
                        setUser(parsedUserData);
                        console.log('Utilisateur chargé depuis localStorage:', parsedUserData);
                    } else {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userData');
                    }
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données utilisateur:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserFromStorage();
    }, []);

    useEffect(() => {
        const checkApiStatus = async () => {
            try {
                const response = await apiService.getStatus();
                console.log('API status:', response.data?.status);
                if (response.data?.status !== 'UP') {
                    console.error('API is down');
                    setMaintenanceMode(true);
                }
            } catch (error) {
                console.error('Error fetching API status:', error);
                setMaintenanceMode(true);
            }
        };

        checkApiStatus();
    }, []);

    useEffect(() => {
        setSearchQuery('');
    }, [location.pathname]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const ProtectedRoute = ({children}: { children: React.ReactNode }) => {
        const token = localStorage.getItem('authToken');

        if (isLoading) {
            return <Loading/>;
        }

        if (!token || !user) {
            return <Navigate to="/login" replace/>;
        }

        return <>{children}</>;
    };

    if (maintenanceMode) {
        return <Maintenance/>;
    }

    const isRestaurantsPage = location.pathname === '/';

    return (
        <div className="app">
            <Header
                user={user}
                setUser={setUser}
                onSearch={isRestaurantsPage ? handleSearch : undefined}
            />
            <div className="content">
                <Routes>
                    <Route path="/login" element={<Login setUser={setUser}/>}/>
                    <Route path="/maintenance" element={<Maintenance/>}/>

                    <Route path="/*" element={
                        <ProtectedRoute>
                            <Routes>
                                <Route path="/" element={<Restaurants/>}/>
                                <Route path="/restaurant/:restaurantId" element={<RestaurantDetails/>}/>
                                <Route path="/profil" element={<User user={user}/>}/>
                                <Route path="/list/:listId" element={<FavoriteListPage/>}/>
                            </Routes>
                        </ProtectedRoute>
                    }/>
                </Routes>
            </div>
        </div>
    );
}

export function App() {
    return (
        <Router>
            <AppContent/>
        </Router>
    );
}