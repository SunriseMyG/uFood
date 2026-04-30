import './User.css';
import RestaurantCarousel from '../../components/restaurantCarousel/restaurantCarousel';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import type {userData} from '../../users';
import axios from 'axios';

type Visit = {
    id: string;
    restaurant_id: string;
    rating: number;
    comment: string;
    date: string;
};

type Restaurant = {
    id: string;
    name: string;
    address: string;
    phone: string;
    location: { lat: number; lng: number };
    directions: string;
    hours: string;
    photos: string[];
    genres: string[];
    priceRange: string;
    rating: number;
    priceRangeNumber?: number;
};

type FavoriteList = {
    id: string;
    name: string;
    restaurants: Restaurant[];
};


function User({user}: { user: userData | null }) {
    const navigate = useNavigate();
    const [_visits, setVisits] = useState<Visit[]>([]);
    const [localVisitedRestaurants, setLocalVisitedRestaurants] = useState<Restaurant[]>([]);
    const [favoriteName, setFavoriteName] = useState("");
    const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([]);

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        for (let i = 0; i < fullStars; i++) {
            stars.push('⭐');
        }
        return stars.join('');
    };

    const createFavoriteList = async () => {
        if (!favoriteName.trim()) {
            alert("Please enter a list name");
            return;
        }
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Missing token");

            const response = await axios.post(
                "https://ufoodapi.herokuapp.com/favorites",
                {
                    name: favoriteName,
                    restaurants: [],
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const newList = response.data;

            const stored = localStorage.getItem("listIds");
            const allIdLists: string[] = stored ? JSON.parse(stored) : [];
            allIdLists.push(newList.id);
            localStorage.setItem("listIds", JSON.stringify(allIdLists));

            setFavoriteLists((prev) => [...prev, newList]);
            setFavoriteName("");
        } catch (error) {
            console.error("Error creating list:", error);
        }
    };

    const fetchFavoriteLists = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) return;

            const stored = localStorage.getItem("listIds");
            const allIdLists: string[] = stored ? JSON.parse(stored) : [];

            const promises = allIdLists.map((id) =>
                axios.get(`https://ufoodapi.herokuapp.com/favorites/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }).then((res) => res.data)
            );

            const results = await Promise.all(promises);
            setFavoriteLists(results);
        } catch (error) {
            console.error("Error fetching lists:", error);
        }
    };


    useEffect(() => {
        fetchFavoriteLists();


        const getLocalVisitedRestaurants = () => {
            try {
                const visited = JSON.parse(localStorage.getItem('visitedRestaurants') || '[]');
                setLocalVisitedRestaurants(visited);
            } catch (error) {
                console.error('Erreur lors de la récupération des restaurants visités:', error);
                setLocalVisitedRestaurants([]);
            }
        };

        getLocalVisitedRestaurants();

        const handleStorageChange = () => {
            getLocalVisitedRestaurants();
        };

        window.addEventListener('storage', handleStorageChange);

        const handleLocalStorageUpdate = () => {
            getLocalVisitedRestaurants();
        };

        window.addEventListener('localStorageUpdate', handleLocalStorageUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localStorageUpdate', handleLocalStorageUpdate);
        };
    }, []);

    const fetchUserVisits = async (userId: string) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                // use env variable for api url
                `${import.meta.env.VITE_API_URL}/users/${userId}/restaurants/visits`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            if (!response.ok) throw new Error('Error fetching visits');
            const data = await response.json();
            setVisits(data);
            fetchVisitedRestaurants(data.map((v: Visit) => v.restaurant_id));
        } catch (error) {
            console.error('API Error:', error);
        }
    };

    const fetchVisitedRestaurants = async (restaurantIds: string[]) => {
        try {
            const token = localStorage.getItem('authToken');
            const promises = restaurantIds.map(id =>
                fetch(`${import.meta.env.VITE_API_URL}/restaurants/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }).then(res => res.json())
            );
            const results = await Promise.all(promises);
            setLocalVisitedRestaurants(results);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        }
    };

    const deleteFavoriteList = async (id: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Missing token');

            const response = await axios.delete(`https://ufoodapi.herokuapp.com/favorites/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // If deletion was successful (204 No Content or 200 OK)
            if (response.status === 200 || response.status === 204) {
                // remove from local state
                setFavoriteLists((prev: FavoriteList[]) => prev.filter((l: FavoriteList) => l.id !== id));

                // remove id from localStorage listIds
                const stored = localStorage.getItem('listIds');
                const allIdLists: string[] = stored ? JSON.parse(stored) : [];
                const updated = allIdLists.filter(listId => listId !== id);
                localStorage.setItem('listIds', JSON.stringify(updated));

                // dispatch a custom event in case other parts of app listen for changes
                window.dispatchEvent(new Event('localStorageUpdate'));
            } else {
                console.error('Failed to delete list, status:', response.status);
                alert('Failed to delete list');
            }
        } catch (error) {
            console.error('Error deleting favorite list:', error);
            alert('Error deleting list');
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchUserVisits(user.id);
        }
    }, [user]);


    return (
        <div className="user-page">
            <div className="user-container">
                <div className="user-content">
                    <div className="unified-user-card">
                        <div className="user-info">
                            <h2 className="user-name">{user?.name}</h2>

                            <div className="user-details">
                                <div className="detail-item">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{user?.email}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Rating:</span>
                                    <span className="detail-value rating">{renderStars(1.5)}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Followers:</span>
                                    <span className="detail-value">{user?.followers.length}</span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Following:</span>
                                    <span className="detail-value">{user?.following.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="favorite-carousel-section">
                            <h3>Favorites</h3>

                            <div className="favorite-input-container">
                                <input
                                    type="text"
                                    placeholder="Enter list name"
                                    className="favorite-input"
                                    value={favoriteName}
                                    onChange={(e: any) => setFavoriteName(e.target.value)}
                                />
                                <button onClick={createFavoriteList} className="favorite-add-btn">
                                    Add to list
                                </button>
                            </div>
                        </div>

                        <div className="favorite-lists-section">
                            {favoriteLists.length > 0 && (
                                <div className="favorite-lists">
                                    <h4>My list{favoriteLists.length > 1 ? 's' : ''}</h4>

                                    {favoriteLists.map((list) => (
                                        <div
                                            key={list.id}
                                            className="favorite-list-item"
                                            onClick={() => {
                                                navigate(`/list/${list.id}`)
                                            }}
                                        >
                                            <h5>{list.name}</h5>

                                            <button
                                                className="favorite-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    const confirmed = window.confirm(`Voulez vous supprimer la liste "${list.name}"?`);
                                                    if (confirmed) {
                                                        deleteFavoriteList(list.id);
                                                    }
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>



                        <div className="user-carousel-section">
                            <h3>Restaurants Recently Viewed</h3>
                            {localVisitedRestaurants.length === 0 ? (
                                <p>No restaurants consulted at this time.</p>
                            ) : (
                                <RestaurantCarousel restaurants={localVisitedRestaurants}/>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default User;