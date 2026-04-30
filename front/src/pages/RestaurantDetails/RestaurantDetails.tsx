import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loading from '../../components/loading/loading';
import Map from '../../components/map/map';
import { getRestaurantById, getFavoriteLists, addRestaurantToList } from '../../api/restaurant';
import type { ApiRestaurant, OpeningHours } from '../../interface/restaurant';
import './RestaurantDetails.css';

function RestaurantDetails() {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [favoriteLists, setFavoriteLists] = useState<{ id: string; name: string }[]>([]);
    const [showFavoritePicker, setShowFavoritePicker] = useState(false);
    const [loadingLists, setLoadingLists] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const totalStars = 5;

        for (let i = 0; i < fullStars; i++) {
            stars.push('★');
        }

        if (hasHalfStar) {
            stars.push('☆');
        }

        const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push('☆');
        }

        return stars.join('');
    };

    const formatOpeningHours = (openingHours: OpeningHours) => {
        const days = [
            { key: 'monday', name: 'Lundi' },
            { key: 'tuesday', name: 'Mardi' },
            { key: 'wednesday', name: 'Mercredi' },
            { key: 'thursday', name: 'Jeudi' },
            { key: 'friday', name: 'Vendredi' },
            { key: 'saturday', name: 'Samedi' },
            { key: 'sunday', name: 'Dimanche' }
        ];

        return days.map(day => {
            const hours = openingHours[day.key as keyof OpeningHours];
            return {
                day: day.name,
                hours: hours || 'Fermé'
            };
        });
    };

    const fetchFavoriteListsHandler = async () => {
        try {
            setLoadingLists(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                setFavoriteLists([]);
                return;
            }

            const stored = localStorage.getItem('listIds');
            const allIdLists: string[] = stored ? JSON.parse(stored) : [];

            const lists = await getFavoriteLists(token, allIdLists);
            setFavoriteLists(lists);
        } catch (err) {
            console.error('Error fetching favorite lists:', err);
            setFavoriteLists([]);
        } finally {
            setLoadingLists(false);
        }
    };

    const addRestaurantToListHandler = async (listId: string) => {
        if (!restaurant) return;
        try {
            setIsAdding(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('You must be logged in to add a restaurant to a list.');
                navigate('/login');
                return;
            }

            await addRestaurantToList(token, listId, restaurant);

            window.dispatchEvent(new Event('localStorageUpdate'));
            setShowFavoritePicker(false);
            alert('Restaurant ajouté à la liste avec succès!');
        } catch (err) {
            console.error('Error adding restaurant to list:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to add restaurant to list.';
            alert(errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        const fetchRestaurant = async () => {
            if (!restaurantId) {
                setError('ID du restaurant manquant');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Token manquant. Veuillez vous reconnecter.');
                }

                const data = await getRestaurantById(restaurantId, token);
                console.log('Restaurant data:', data);
                setRestaurant(data);

            } catch (error) {
                console.error('Error fetching restaurant:', error);
                setError(error instanceof Error ? error.message : 'Erreur lors du chargement du restaurant');

                if (error instanceof Error && error.message.includes('Token expiré')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    navigate('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurant();
    }, [restaurantId, navigate]);

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="restaurant-details">
                <div className="error-container">
                    <div className="error-card">
                        <h2>❌ Erreur</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate('/')} className="back-btn">
                            Back to restaurants
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="restaurant-details">
                <div className="error-container">
                    <div className="error-card">
                        <h2>🍽️ Restaurant not found</h2>
                        <p>The restaurant you are looking for does not exist or is no longer available.</p>
                        <button onClick={() => navigate('/')} className="back-btn">
                            Back to restaurants
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formattedHours = formatOpeningHours(restaurant.opening_hours);
    const priceRange = '$'.repeat(restaurant.price_range || 1);

    return (
        <div className="restaurant-details">
            <div className="restaurant-details-container">
                <button onClick={() => navigate('/')} className="back-btn">
                    ← Back to restaurants
                </button>

                <div className="restaurant-hero">
                    {restaurant.pictures && restaurant.pictures.length > 0 && (
                        <div className="hero-image-container">
                            <img
                                src={restaurant.pictures[0]}
                                alt={restaurant.name}
                                className="hero-image"
                            />
                            <div className="hero-overlay"></div>
                        </div>
                    )}
                    <div className="hero-content">
                        <h1 className="restaurant-name">{restaurant.name}</h1>
                        <div className="rating-section">
                            <div className="rating-display">
                                <span className="stars">{renderStars(restaurant.rating)}</span>
                                <span className="rating-number">{restaurant.rating}/5</span>
                            </div>
                            <div className="price-display">{priceRange}</div>
                            <div style={{ position: 'relative' }}>
                                <button
                                    className="favorite-btn"
                                    onClick={async () => {
                                        await fetchFavoriteListsHandler();
                                        setShowFavoritePicker(true);
                                    }}
                                >
                                    Ajouter dans une liste
                                </button>

                                {showFavoritePicker && (
                                    <div className="favorite-picker">
                                        <div className="picker-card">
                                            <h4>Ajouter à une liste</h4>
                                            {loadingLists ? (
                                                <p>Loading lists...</p>
                                            ) : favoriteLists.length === 0 ? (
                                                <p>Aucune liste trouvée. Créez-en une depuis votre profil.</p>
                                            ) : (
                                                <ul className="picker-list">
                                                    {favoriteLists.map((l) => (
                                                        <li key={l.id}>
                                                            <button
                                                                className="picker-item"
                                                                onClick={() => addRestaurantToListHandler(l.id)}
                                                                disabled={isAdding}
                                                            >
                                                                {l.name}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <div className="picker-actions">
                                                <button onClick={() => setShowFavoritePicker(false)}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="restaurant-content">
                    {/* ...existing code... reste identique */}
                    <div className="info-section">
                        <h2 className="section-title">📍 Information</h2>

                        <div className="info-grid">
                            <div className="info-card">
                                <div className="info-header">
                                    <h3>📍 Address</h3>
                                </div>
                                <p className="info-text">{restaurant.address}</p>
                                <button
                                    onClick={() => window.open(
                                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`,
                                        '_blank'
                                    )}
                                    className="action-btn"
                                >
                                    📍 View on Google Maps
                                </button>
                            </div>

                            <div className="info-card">
                                <div className="info-header">
                                    <h3>📞 Phone Number</h3>
                                </div>
                                <p className="info-text">{restaurant.tel}</p>
                                <a href={`tel:${restaurant.tel}`} className="action-btn phone-btn">
                                    📞 Call
                                </a>
                            </div>

                            <div className="info-card">
                                <div className="info-header">
                                    <h3>🍽️ Cuisine Genres</h3>
                                </div>
                                <div className="genres-container">
                                    {restaurant.genres.map((genre, index) => (
                                        <span key={index} className="genre-tag">{genre}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-header">
                                    <h3>📍 GPS Coordinates</h3>
                                </div>
                                <div className="coordinates">
                                    <p>Latitude: {restaurant.location.coordinates[1]}</p>
                                    <p>Longitude: {restaurant.location.coordinates[0]}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Map restaurant={restaurant} />

                    <div className="hours-section">
                        <h2 className="section-title">🕒 Opening Hours</h2>
                        <div className="hours-card">
                            <div className="hours-grid">
                                {formattedHours.map((dayInfo, index) => (
                                    <div key={index} className="hours-item">
                                        <span className="day-name">{dayInfo.day}</span>
                                        <span className={`hours-time ${dayInfo.hours === 'Fermé' ? 'closed' : 'open'}`}>
                                            {dayInfo.hours}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {restaurant.pictures && restaurant.pictures.length > 1 && (
                        <div className="photos-section">
                            <h2 className="section-title">📷 Gallery</h2>
                            <div className="photo-gallery">
                                {restaurant.pictures.map((photo, index) => (
                                    <div key={index} className="photo-item">
                                        <img
                                            src={photo}
                                            alt={`${restaurant.name} ${index + 1}`}
                                            className="gallery-photo"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RestaurantDetails;