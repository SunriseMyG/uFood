import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getFavoriteListById,
    getRestaurantsFromList,
    updateFavoriteListName,
    deleteRestaurantFromList
} from '../../api/favorites';
import './List.css';

type FavoriteList = {
    id: string;
    name: string;
    restaurants?: any[];
};

type ApiRestaurantMini = {
    id: string;
    name: string;
};

function FavoriteListPage() {
    const { listId } = useParams<{ listId: string }>();
    const navigate = useNavigate();
    const [list, setList] = useState<FavoriteList | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [restaurants, setRestaurants] = useState<ApiRestaurantMini[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFavoriteList();
    }, [listId]);

    const fetchFavoriteList = async () => {
        if (!listId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Missing authentication token');
            }

            const listData = await getFavoriteListById(listId, token);
            setList(listData);
            setEditedName(listData.name || '');

            const ids: string[] = Array.isArray(listData.restaurants)
                ? listData.restaurants.map((r: any) => (typeof r === 'string' ? r : r.id))
                : [];

            if (ids.length > 0) {
                const restaurantData = await getRestaurantsFromList(ids, token);
                setRestaurants(restaurantData);
            } else {
                setRestaurants([]);
            }
        } catch (err) {
            console.error('Error fetching the list:', err);
            setError(err instanceof Error ? err.message : 'Unable to load the list');
        } finally {
            setLoading(false);
        }
    };

    const handleView = (restaurantId: string) => {
        navigate(`/restaurant/${restaurantId}`);
    };

    const handleStartEdit = () => {
        setIsEditingName(true);
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setEditedName(list?.name || '');
    };

    const handleSaveName = async () => {
        if (!list || !editedName.trim()) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Missing auth token');

            const updatedList = await updateFavoriteListName(list.id, editedName, token);
            setList(updatedList);
            setIsEditingName(false);
            window.dispatchEvent(new Event('localStorageUpdate'));
        } catch (err) {
            console.error('Error renaming list:', err);
            alert('Failed to rename list');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFromList = async (restaurantId: string) => {
        if (!listId) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Missing auth token');

            await deleteRestaurantFromList(listId, restaurantId, token);

            setRestaurants((prev) => prev.filter(r => r.id !== restaurantId));

            setList((prev) => {
                if (!prev) return prev;
                const updated = { ...prev } as any;
                if (Array.isArray(updated.restaurants)) {
                    updated.restaurants = updated.restaurants.filter((r: any) =>
                        (typeof r === 'string' ? r : r.id) !== restaurantId
                    );
                }
                return updated;
            });

            window.dispatchEvent(new Event('localStorageUpdate'));
        } catch (err) {
            console.error('Error deleting restaurant from list:', err);
            alert('Failed to remove restaurant from list');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="favorite-list-page">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error || !list) {
        return (
            <div className="favorite-list-page">
                <div className="error">
                    <p>{error || 'List not found'}</p>
                    <button onClick={() => navigate('/profil')} className="back-button">
                        Back to profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="favorite-list-page">
            <div className="list-header">
                <button onClick={() => navigate('/profil')} className="back-button">
                    Back
                </button>

                {!isEditingName ? (
                    <>
                        <h1 className="list-title">{list.name}</h1>
                        <button className="rename-btn" onClick={handleStartEdit}>Rename</button>
                    </>
                ) : (
                    <div className="rename-row">
                        <input
                            className="rename-input"
                            value={editedName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (e.target) {
                                    setEditedName(e.target.value);
                                }
                            }}
                        />
                        <button className="save-btn" onClick={handleSaveName}>Save</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                )}
            </div>
            <div className="list-body">
                {restaurants.length === 0 ? (
                    <div className="empty-list">Aucun restaurant dans cette liste.</div>
                ) : (
                    <ul className="restaurant-list">
                        {restaurants.map((r) => (
                            <li key={r.id} className="restaurant-item">
                                <span className="restaurant-name">{r.name}</span>
                                <div className="restaurant-actions">
                                    <button className="view-btn" onClick={() => handleView(r.id)}>View</button>
                                    <button className="delete-btn" onClick={() => handleDeleteFromList(r.id)}>Delete from list</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default FavoriteListPage;