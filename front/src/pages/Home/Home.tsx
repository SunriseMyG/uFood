import './Home.css';
import RestaurantCard from "../../components/restaurantCard/RestaurantCard";
import RestaurantPageFooter from '../../components/restaurantPageFooter/restaurantPageFooter';
import { useEffect, useState } from "react";
import { FaFilter, FaTimes, FaStar, FaSearch } from "react-icons/fa";
import Loading from '../../components/loading/loading';
import { getAllRestaurantsPaginated } from '../../api/restaurant';
import type { ApiRestaurant, OpeningHours, Restaurant } from '../../interface/restaurant';

interface RestaurantsProps {
    searchQuery?: string;
}

interface Filters {
    genres: string[];
    priceRanges: number[];
    minRating: number;
}

function Restaurants({ searchQuery = '' }: RestaurantsProps) {
    const mapApiRestaurantToRestaurant = (apiRestaurant: ApiRestaurant): Restaurant => {
        const getPriceRangeString = (range: number): string => {
            return '$'.repeat(range || 1);
        };

        const getHoursString = (openingHours: OpeningHours): string => {
            const days = Object.entries(openingHours);
            const openDays = days.filter(([_, hours]) => hours !== null);
            if (openDays.length === 0) return "Hours not available";

            const [day, hours] = openDays[0];
            return `${day}: ${hours}`;
        };

        return {
            id: apiRestaurant.id,
            name: apiRestaurant.name,
            address: apiRestaurant.address,
            phone: apiRestaurant.tel,
            location: {
                lat: apiRestaurant.location?.coordinates?.[1] || 0,
                lng: apiRestaurant.location?.coordinates?.[0] || 0
            },
            directions: `https://maps.google.com/?q=${apiRestaurant.location?.coordinates?.[1] || 0},${apiRestaurant.location?.coordinates?.[0] || 0}`,
            hours: getHoursString(apiRestaurant.opening_hours),
            photos: apiRestaurant.pictures || [],
            genres: apiRestaurant.genres || [],
            priceRange: getPriceRangeString(apiRestaurant.price_range),
            rating: Math.round((apiRestaurant.rating || 0) * 10) / 10,
            priceRangeNumber: apiRestaurant.price_range || 1
        };
    };

    const [page, setPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(24);
    const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
    const [displayedRestaurants, setDisplayedRestaurants] = useState<Restaurant[]>([]);
    const [availableGenres, setAvailableGenres] = useState<string[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
    const [filters, setFilters] = useState<Filters>({
        genres: [],
        priceRanges: [],
        minRating: 0
    });

    useEffect(() => {
        const fetchAllRestaurants = async () => {
            setIsLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Token manquant. Veuillez vous reconnecter.');
                }

                const apiRestaurants = await getAllRestaurantsPaginated(token);
                const mappedRestaurants = apiRestaurants.map(mapApiRestaurantToRestaurant);
                setAllRestaurants(mappedRestaurants);

                const genres = new Set<string>();
                mappedRestaurants.forEach(restaurant => {
                    restaurant.genres.forEach(genre => genres.add(genre));
                });
                setAvailableGenres(Array.from(genres).sort());

            } catch (error) {
                console.error('Error fetching restaurants:', error);
                setError(error instanceof Error ? error.message : 'Error loading restaurants');

                if (error instanceof Error && error.message.includes('Expired token')) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllRestaurants();
    }, []);

    useEffect(() => {
        setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        let filtered = [...allRestaurants];

        const currentSearchQuery = localSearchQuery || searchQuery;
        if (currentSearchQuery.trim()) {
            const query = currentSearchQuery.toLowerCase();
            filtered = filtered.filter(restaurant =>
                restaurant.name.toLowerCase().includes(query) ||
                restaurant.address.toLowerCase().includes(query) ||
                restaurant.genres.some(genre => genre.toLowerCase().includes(query))
            );
        }

        if (filters.genres.length > 0) {
            filtered = filtered.filter(restaurant =>
                restaurant.genres.some(genre => filters.genres.includes(genre))
            );
        }

        if (filters.priceRanges.length > 0) {
            filtered = filtered.filter(restaurant =>
                filters.priceRanges.includes(restaurant.priceRangeNumber)
            );
        }

        if (filters.minRating > 0) {
            filtered = filtered.filter(restaurant => restaurant.rating >= filters.minRating);
        }

        setFilteredRestaurants(filtered);
        setPage(1);
    }, [allRestaurants, localSearchQuery, searchQuery, filters]);

    useEffect(() => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginated = filteredRestaurants.slice(startIndex, endIndex);
        setDisplayedRestaurants(paginated);
    }, [filteredRestaurants, page, itemsPerPage]);

    const handleLocalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearchQuery((e.target as HTMLInputElement).value);
    };

    const handleLocalSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleGenreChange = (genre: string) => {
        setFilters(prev => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter(g => g !== genre)
                : [...prev.genres, genre]
        }));
    };

    const handlePriceRangeChange = (priceRange: number) => {
        setFilters(prev => ({
            ...prev,
            priceRanges: prev.priceRanges.includes(priceRange)
                ? prev.priceRanges.filter(p => p !== priceRange)
                : [...prev.priceRanges, priceRange]
        }));
    };

    const handleRatingChange = (rating: number) => {
        setFilters(prev => ({
            ...prev,
            minRating: prev.minRating === rating ? 0 : rating
        }));
    };

    const clearAllFilters = () => {
        setFilters({
            genres: [],
            priceRanges: [],
            minRating: 0
        });
    };

    const hasActiveFilters = filters.genres.length > 0 || filters.priceRanges.length > 0 || filters.minRating > 0 || searchQuery.trim() !== '';

    if (error) {
        return (
            <div className="restaurants-page">
                <div className="restaurants-container">
                    <div className="error-message">
                        <h2>Error</h2>
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="login-redirect-btn"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="restaurants-page">
                <div className="restaurants-container">
                    <Loading />
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);

    return (
        <div className="restaurants-page">
            <div className="restaurants-container">
                <div className="restaurants-header">
                    <h1>Our Restaurants</h1>
                    <p className="restaurants-subtitle">
                        {filteredRestaurants.length} restaurant{filteredRestaurants.length > 1 ? 's' : ''} found{filteredRestaurants.length > 1 ? 's' : ''}
                        {searchQuery && ` for "${searchQuery}"`}
                    </p>
                </div>

                <div className="search-filter-bar">
                    <form className="local-search-bar" onSubmit={handleLocalSearchSubmit}>
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search for a restaurant, an address, a type of cuisine..."
                            className="search-input"
                            value={localSearchQuery}
                            onChange={handleLocalSearchChange}
                        />
                    </form>

                    <button
                        className={`filter-button ${hasActiveFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter />
                        Filtres
                        {hasActiveFilters && (
                            <span className="filter-count">
                                {filters.genres.length + filters.priceRanges.length + (filters.minRating > 0 ? 1 : 0)}
                            </span>
                        )}
                    </button>

                    <div className="items-per-page">
                        <label>
                            Show per page:
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                    setPage(1);
                                }}
                            >
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                                <option value={96}>96</option>
                            </select>
                        </label>
                    </div>
                </div>

                {showFilters && (
                    <div className="filters-panel">
                        <div className="filters-header">
                            <h3>Filters</h3>
                            <button
                                className="close-filters"
                                onClick={() => setShowFilters(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="filters-content">
                            <div className="filter-group">
                                <h4>Cuisine Type</h4>
                                <div className="filter-options">
                                    {availableGenres.map(genre => (
                                        <label key={genre} className="filter-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={filters.genres.includes(genre)}
                                                onChange={() => handleGenreChange(genre)}
                                            />
                                            <span className="checkmark"></span>
                                            {genre}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <h4>Price Range</h4>
                                <div className="filter-options">
                                    {[1, 2, 3, 4].map(price => (
                                        <label key={price} className="filter-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={filters.priceRanges.includes(price)}
                                                onChange={() => handlePriceRangeChange(price)}
                                            />
                                            <span className="checkmark"></span>
                                            {'$'.repeat(price)}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <h4>Minimum Rating</h4>
                                <div className="filter-options rating-options">
                                    {[1, 2, 3, 4].map(rating => (
                                        <label key={rating} className="filter-checkbox rating-option">
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={filters.minRating === rating}
                                                onChange={() => handleRatingChange(rating)}
                                            />
                                            <span className="checkmark radio"></span>
                                            <div className="rating-display">
                                                {Array.from({ length: rating }, (_, i) => (
                                                    <FaStar key={i} className="star" />
                                                ))}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {hasActiveFilters && (
                                <div className="filter-actions">
                                    <button
                                        className="clear-filters-btn"
                                        onClick={clearAllFilters}
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="restaurants-grid">
                    {displayedRestaurants.map((restaurant, index) => (
                        <RestaurantCard key={`${restaurant.name}-${index}`} restaurant={restaurant} />
                    ))}
                </div>

                {displayedRestaurants.length === 0 && !isLoading && !error && (
                    <div className="no-restaurants">
                        <p>No restaurants found for the selected criteria.</p>
                        {hasActiveFilters && (
                            <button onClick={clearAllFilters} className="clear-filters-btn">
                                Clear All Filters
                            </button>
                        )}
                    </div>
                )}

                {displayedRestaurants.length > 0 && totalPages > 1 && (
                    <div className="restaurants-footer">
                        <RestaurantPageFooter
                            actualPage={page}
                            totalPages={totalPages - 1}
                            onPageChange={(newPage) => {
                                setPage(newPage);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Restaurants;