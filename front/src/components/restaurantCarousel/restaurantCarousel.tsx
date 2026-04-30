import RestaurantCard from '../restaurantCard/RestaurantCard';
import './restaurantCarousel.css';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useEffect, useState } from 'react';

interface Restaurant {
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
}

interface RestaurantCarouselProps {
    restaurants: Restaurant[];
}

function RestaurantCarousel({ restaurants }: RestaurantCarouselProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 480);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const mobileSettings = {
        dots: restaurants.length > 1,
        infinite: restaurants.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: false,
        arrows: false,
        centerMode: true,
        centerPadding: '0',
        focusOnSelect: true,
        swipeToSlide: true,
        variableWidth: false,
        adaptiveHeight: false
    };

    const desktopSettings = {
        dots: true,
        infinite: restaurants.length > 3,
        speed: 500,
        slidesToShow: Math.min(3, restaurants.length),
        slidesToScroll: 1,
        autoplay: restaurants.length > 3,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        arrows: restaurants.length > 3,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: Math.min(3, restaurants.length),
                    slidesToScroll: 1,
                    infinite: restaurants.length > 3,
                    autoplay: restaurants.length > 3,
                    arrows: restaurants.length > 3
                }
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.min(2, restaurants.length),
                    slidesToScroll: 1,
                    infinite: restaurants.length > 2,
                    autoplay: restaurants.length > 2,
                    arrows: restaurants.length > 2
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: Math.min(2, restaurants.length),
                    slidesToScroll: 1,
                    infinite: restaurants.length > 2,
                    autoplay: restaurants.length > 2,
                    arrows: restaurants.length > 2
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: restaurants.length > 1,
                    autoplay: restaurants.length > 1,
                    arrows: restaurants.length > 1,
                    centerMode: false,
                    variableWidth: false
                }
            }
        ]
    };

    if (restaurants.length === 0) {
        return (
            <div className="carousel-container">
                <div className="carousel-empty">
                    <p>Aucun restaurant à afficher pour le moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`carousel-container ${isMobile ? 'mobile-carousel' : ''}`}>
            <div className="carousel-wrapper">
                <Slider {...(isMobile ? mobileSettings : desktopSettings)}>
                    {restaurants.map((restaurant, index) => (
                        <div key={`${restaurant.id}-${index}`} className="carousel-slide">
                            <div className="carousel-slide-inner">
                                <RestaurantCard restaurant={restaurant} />
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}

export default RestaurantCarousel;