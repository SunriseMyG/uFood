const API_BASE_URL = import.meta.env.VITE_API_URL;

type FavoriteList = {
    id: string;
    name: string;
    restaurants?: any[];
};

type ApiRestaurantMini = {
    id: string;
    name: string;
};

export const getFavoriteListById = async (listId: string, token: string): Promise<FavoriteList> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token expiré ou invalide. Veuillez vous reconnecter.');
            }
            if (response.status === 404) {
                throw new Error('Liste non trouvée');
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching favorite list:', error);
        throw error;
    }
};

export const getRestaurantsFromList = async (restaurantIds: string[], token: string): Promise<ApiRestaurantMini[]> => {
    try {
        if (restaurantIds.length === 0) {
            return [];
        }

        const promises = restaurantIds.map((id) =>
            fetch(`${API_BASE_URL}/restaurants/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }).then(res => res.json())
        );

        const results = await Promise.all(promises);
        return results.map((r: any) => ({ id: r.id, name: r.name }));
    } catch (error) {
        console.error('Error fetching restaurants from list:', error);
        return [];
    }
};

export const updateFavoriteListName = async (listId: string, newName: string, token: string): Promise<FavoriteList> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newName }),
        });

        if (!response.ok) {
            throw new Error('Échec de la mise à jour du nom de la liste');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating favorite list name:', error);
        throw error;
    }
};

export const deleteRestaurantFromList = async (listId: string, restaurantId: string, token: string): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/favorites/${listId}/restaurants/${restaurantId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Échec de la suppression du restaurant de la liste');
        }
    } catch (error) {
        console.error('Error deleting restaurant from list:', error);
        throw error;
    }
};