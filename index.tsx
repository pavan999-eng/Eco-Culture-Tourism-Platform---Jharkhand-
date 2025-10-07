// Fix: Add SpeechRecognition and webkitSpeechRecognition to the window object for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat, Type } from "@google/genai";

// Polyfill for SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// --- TYPE DEFINITIONS ---
type Place = { name: string; location: string; image: string; description: string; };
type Guide = { name: string; specialty: string; image: string; id: number; bio: string; languages: string[]; experience: number; tagline: string; verificationId: string; };
type Hotel = { name: string; location: string; price: number; rating: number; image: string; description: string; amenities: string[]; };
type Market = { name: string; location: string; image: string; description: string; popularItems: string[]; };
type EmergencyContact = { name: string; phone: string; };
type NotificationType = 'event' | 'alert' | 'announcement' | 'info';
type NotificationItem = { name: string; date: string; description: string; type: NotificationType; };
type Page = 'home' | 'hotels' | 'guides' | 'maps' | 'markets' | 'plan' | 'sos' | 'userProfile';
type Booking = {
  type: 'Hotel' | 'Guide';
  name: string;
  bookingDate: string;
  details: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    tourDate?: string;
    groupSize?: number;
    notes?: string;
  }
};

type ItineraryActivity = { time: string; description: string; type: string; };
type ItineraryDay = { day: string; title: string; activities: ItineraryActivity[]; };


const App = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{ itemType: 'Hotel' | 'Guide'; itemName: string } | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // --- AUTHENTICATION & NOTIFICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFormDetails, setBookingFormDetails] = useState<{ itemType: 'Hotel' | 'Guide'; itemName: string } | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        setBookings(allBookings[user] || []);
    }
  }, []);

  // --- MOCK DATA ---
  const trendingPlaces: Place[] = [
    { name: 'Betla National Park', location: 'Latehar', image: 'https://uploads.onecompiler.io/42untjbcp/43xfj2twm/Gemini_Generated_Image_4yd8nw4yd8nw4yd8.png', description: 'Home to tigers, elephants, and a rich variety of deer species. A must-visit for wildlife enthusiasts.' },
    { name: 'Baidyanath Temple', location: 'Deoghar', image: 'https://uploads.onecompiler.io/42untjbcp/43xfj2twm/Gemini_Generated_Image_4pghpo4pghpo4pgh.png', description: 'One of the twelve Jyotirlingas, this ancient temple is a major pilgrimage site for Hindus.' },
    { name: 'Patratu Valley', location: 'Ranchi', image: 'https://uploads.onecompiler.io/42untjbcp/43xfj2twm/Gemini_Generated_Image_i6i64ti6i64ti6i6.png', description: 'Famous for its stunning winding roads and panoramic views of the Patratu Dam. A scenic drive you won\'t forget.' },
    { name: 'Hundru Falls', location: 'Ranchi', image: 'https://uploads.onecompiler.io/42untjbcp/43xfj2twm/Gemini_Generated_Image_w73do4w73do4w73d.png', description: 'Witness the Subarnarekha River fall from a height of 98 meters, creating a breathtaking spectacle.' },
    { name: 'Dassam Falls', location: 'Ranchi', image: 'https://uploads.onecompiler.io/42untjbcp/43xfmg7uc/Gemini_Generated_Image_4tt4z04tt4z04tt4.png', description: 'A beautiful natural waterfall surrounded by lush greenery, perfect for a refreshing day trip.'},
    { name: 'Jubilee Park', location: 'Jamshedpur', image: 'https://uploads.onecompiler.io/42untjbcp/43xfmg7uc/Gemini_Generated_Image_yswt0vyswt0vyswt.png', description: 'A sprawling urban park inspired by Mysore\'s Brindavan Gardens, with fountains and a zoo.' },
    { name: 'Jonha Falls', location: 'Ranchi', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Gemini_Generated_Image_9e2dnn9e2dnn9e2d.png', description: 'Also known as Gautamdhara, as Lord Buddha is believed to have bathed here, surrounded by dense forests.' },
    { name: 'Parasnath Hills', location: 'Giridih', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Screenshot%202025-09-22%20at%205.49.47%E2%80%AFPM.png', description: 'A major Jain pilgrimage site with a cluster of temples atop the highest peak in Jharkhand.' },
  ];
  
  const enchantedEchoes: Place[] = [
    { name: 'Betla National Park', location: 'Latehar', image: 'https://uploads.onecompiler.io/42untjbcp/43xfj2twm/Gemini_Generated_Image_4yd8nw4yd8nw4yd8.png', description: 'A vast park with a diverse range of wildlife, including tigers, elephants, and bison.' },
    { name: 'Hundru Falls', location: 'Ranchi', image: 'https://uploads.onecompiler.io/42untjbcp/43xfj2twm/Gemini_Generated_Image_w73do4w73do4w73d.png', description: 'A spectacular waterfall where the Subarnarekha river drops from a height of 320 feet.' },
    { name: 'Jonha Falls', location: 'Ranchi', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Gemini_Generated_Image_9e2dnn9e2dnn9e2d.png', description: 'A serene waterfall, also known as Gautamdhara, surrounded by lush greenery and tranquility.' },
    { name: 'Saranda Forest', location: 'West Singhbhum', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Screenshot%202025-09-22%20at%206.50.07%E2%80%AFPM.png', description: 'Known as the "land of seven hundred hills," it is Asia\'s largest and densest Sal forest.' },
  ];
  
  const culturalTreasures: Place[] = [
    { name: 'Parasnath Hills', location: 'Giridih', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Screenshot%202025-09-22%20at%205.49.47%E2%80%AFPM.png', description: 'The highest mountain peak in Jharkhand, a sacred site for Jains with numerous temples.' },
    { name: 'Rajrappa Temple', location: 'Ramgarh', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Screenshot%202025-09-22%20at%206.55.20%E2%80%AFPM.png', description: 'A Shakti Peeth dedicated to Goddess Chhinnamasta, located at a stunning river confluence.' },
    { name: 'Palamu Forts', location: 'Palamu', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%207.16.51%E2%80%AFPM.png', description: 'A pair of historic forts deep in the forests, telling tales of the Chero dynasty.' },
    { name: 'Tribal Handicrafts', location: 'Across Jharkhand', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.16.55%E2%80%AFPM.png', description: 'Explore centers showcasing exquisite Dokra art, bamboo crafts, and traditional paintings.' },
  ];
  
  const tribalFolks: Place[] = [
    { name: 'Karma Dance', location: 'Cultural Festival', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.17.48%E2%80%AFPM.png', description: 'A communal dance performed during the Karma festival, celebrating the sacred Karam tree.' },
    { name: 'Dhemsa Dance', location: 'Tribal Communities', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.18.32%E2%80%AFPM.png', description: 'A vibrant and rhythmic group dance performed by tribal women in traditional attire.' },
    { name: 'Chhau Dance', location: 'Seraikela', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.19.23%E2%80%AFPM.png', description: 'A semi-classical Indian dance with martial origins, often performed with ornate masks.' },
    { name: 'Mardani Jhumar', location: 'Nagpuria Region', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.20.34%E2%80%AFPM.png', description: 'A powerful and energetic folk dance performed by men, reflecting masculine grace and strength.' },
  ];


  const ecoTourismPlaces: Place[] = [
    { name: 'Netarhat', location: 'Latehar', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.30.05%E2%80%AFPM.png', description: 'Known as the "Queen of Chotanagpur," Netarhat is a serene hill station famous for its glorious sunrises and sunsets.' },
    { name: 'Saranda Forest', location: 'West Singhbhum', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xfqcfr7/Screenshot%202025-09-22%20at%206.50.07%E2%80%AFPM.png', description: 'The largest Sal forest in Asia, offering a dense, untouched wilderness experience for nature lovers.' },
    { name: 'Canary Hill', location: 'Hazaribagh', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2175&auto=format&fit=crop&ixlib-rb-4.0.3', description: 'A picturesque hill with a watchtower providing panoramic views of Hazaribagh town and the surrounding forests.' },
    { name: 'McCluskieganj', location: 'Ranchi', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.33.54%E2%80%AFPM.png', description: 'A quaint town with a unique Anglo-Indian heritage, surrounded by hills and forests, offering a peaceful retreat.' },
  ];

  const guides: Guide[] = [
      { id: 1, name: 'Rohan Gupta', specialty: 'Wildlife & Nature Expert', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgu7h2w/Screenshot%202025-09-23%20at%2012.50.37%E2%80%AFAM.png', experience: 15, languages: ['English', 'Hindi', 'Santhali'], tagline: "Unveiling the secrets of Jharkhand's wilds.", bio: 'Rohan has spent over 15 years exploring the jungles of Jharkhand. His knowledge of the local flora and fauna is unmatched. Join him for an unforgettable wildlife safari.', verificationId: 'JH-TOUR-GUIDE-8431A' },
      { id: 2, name: 'Priya Singh', specialty: 'Cultural & Heritage Tours', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.50.45%E2%80%AFPM.png', experience: 10, languages: ['English', 'Hindi', 'Santhali'], tagline: 'Bringing the stories of ancient stones to life.', bio: 'Priya is a historian and storyteller who brings the ancient temples and monuments of Jharkhand to life. Her tours are a deep dive into the state\'s rich history and culture.', verificationId: 'JH-TOUR-GUIDE-9112B' },
      { id: 3, name: 'Ankit Mishra', specialty: 'Adventure & Trekking Guide', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgu7h2w/Screenshot%202025-09-23%20at%2012.52.29%E2%80%AFAM.png', experience: 8, languages: ['English', 'Hindi', 'Nagpuri', 'Santhali'], tagline: 'Your partner for the highest peaks and deepest falls.', bio: 'An adrenaline junkie with a passion for the outdoors, Ankit leads thrilling treks to the highest peaks and most remote waterfalls in Jharkhand. Safety is his top priority.', verificationId: 'JH-TOUR-GUIDE-7554C' },
      { id: 4, name: 'Sunita Devi', specialty: 'Local Cuisine & Crafts', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.55.06%E2%80%AFPM.png', experience: 20, languages: ['Hindi', 'Santhali', 'Bengali'], tagline: 'Taste the true, authentic soul of Jharkhand.', bio: 'Sunita offers a taste of authentic Jharkhand. From bustling local markets to hands-on cooking classes and artisan workshops, she provides an immersive cultural experience.', verificationId: 'JH-TOUR-GUIDE-6201D' },
  ];
  
  const hotels: Hotel[] = [
    { name: 'Radisson Blu Hotel', location: 'Ranchi', price: 7500, rating: 4.5, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'A premier luxury hotel in the heart of Ranchi, offering world-class amenities and services.', amenities: ['Pool', 'Spa', 'WiFi', 'Gym', 'Restaurant'] },
    { name: 'The Alcor Hotel', location: 'Jamshedpur', price: 6000, rating: 4.3, image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.36.19%E2%80%AFPM.png', description: 'Modern elegance meets comfort at The Alcor, perfect for business and leisure travelers.', amenities: ['WiFi', 'Gym', 'Restaurant', 'Parking'] },
    { name: 'Hotel Rajmahal', location: 'Deoghar', price: 3500, rating: 4.0, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Experience traditional hospitality with comfortable accommodations near major temples.', amenities: ['Restaurant', 'Parking', 'Room Service'] },
    { name: 'Le Lac Sarovar Portico', location: 'Ranchi', price: 5500, rating: 4.2, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'Overlooking the serene Ranchi Lake, this hotel offers stunning views and a tranquil atmosphere.', amenities: ['Lake View', 'WiFi', 'Restaurant', 'Gym'] },
    { name: 'The Sonnet', location: 'Jamshedpur', price: 4800, rating: 4.1, image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', description: 'A boutique hotel known for its personalized service and contemporary design.', amenities: ['Pool', 'WiFi', 'Gym', 'Bar'] },
    { name: 'Capitol Hill', location: 'Ranchi', price: 4200, rating: 4.0, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2080&auto=format&fit=crop&ixlib-rb-4.0.3', description: 'Located in the city center, offering convenience and comfort for all travelers.', amenities: ['Restaurant', 'WiFi', 'Parking'] },
    { name: 'Hotel Ganga Regency', location: 'Jamshedpur', price: 3800, rating: 3.9, image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.39.47%E2%80%AFPM.png', description: 'A reliable choice for travelers seeking comfort and value for money.', amenities: ['Room Service', 'WiFi', 'Parking'] },
    { name: 'Chanakya BNR Hotel', location: 'Ranchi', price: 5800, rating: 4.4, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3', description: 'A heritage hotel that combines old-world charm with modern amenities.', amenities: ['Pool', 'Restaurant', 'Garden', 'WiFi'] },
  ];

  const localMarkets: Market[] = [
    { name: 'Upper Bazaar', location: 'Ranchi', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%209.58.58%E2%80%AFPM.png', description: 'A bustling, historic market in the heart of the city, famous for textiles, spices, and traditional snacks.', popularItems: ['Pua', 'Thekua', 'Bamboo Crafts', 'Spices'] },
    { name: 'Sakchi Market', location: 'Jamshedpur', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%2010.01.13%E2%80%AFPM.png', description: 'One of the oldest markets in Jamshedpur, offering everything from electronics to fresh produce and street food.', popularItems: ['Fresh Produce', 'Street Food', 'Electronics', 'Textiles'] },
    { name: 'Paltan Bazaar', location: 'Deoghar', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%2010.02.40%E2%80%AFPM.png', description: 'Located near the Baidyanath Temple, this market is perfect for buying religious items, souvenirs, and local sweets.', popularItems: ['Peda', 'Religious Idols', 'Bangles', 'Puja Items'] },
    { name: 'Firayalal', location: 'Ranchi', image: 'https://uploads.onecompiler.io/43xfqcbsu/43xgdjqum/Screenshot%202025-09-22%20at%2010.05.30%E2%80%AFPM.png', description: 'A famous shopping destination known for its wide range of clothing, accessories, and branded goods.', popularItems: ['Apparel', 'Footwear', 'Cosmetics', 'Jewellery'] },
  ];
  
  const policeStations: EmergencyContact[] = [ { name: 'Kotwali Thana, Ranchi', phone: '0651-2215444' }, { name: 'Sakchi Thana, Jamshedpur', phone: '0657-2424111' }, { name: 'Dhanbad Sadar Thana', phone: '0326-2313333' }, ];
  const fireStations: EmergencyContact[] = [ { name: 'Audrey House Fire Station, Ranchi', phone: '0651-2461001' }, { name: 'Golmuri Fire Station, Jamshedpur', phone: '0657-2342222' }, { name: 'Dhanbad Fire Station', phone: '0326-2303030' }, ];
  const hospitals: EmergencyContact[] = [ { name: 'RIMS, Ranchi', phone: '0651-2541768' }, { name: 'Tata Main Hospital, Jamshedpur', phone: '0657-6641111' }, { name: 'PMCH, Dhanbad', phone: '0326-2204567' }, ];

  const notifications: NotificationItem[] = [
    { name: 'Sarhul Festival', date: 'April 2025', description: 'A vibrant tribal festival celebrating nature and the new year. Witness traditional dances and music.', type: 'event' },
    { name: 'Road Closure Alert', date: 'Ongoing', description: 'The road to Patratu Valley may experience temporary closures due to monsoon repairs. Check before you travel.', type: 'alert' },
    { name: 'New Light Show at Jubilee Park', date: 'Effective Immediately', description: 'A new musical fountain and light show has been inaugurated at Jubilee Park, Jamshedpur. Shows daily at 7 PM.', type: 'announcement' },
    { name: 'Hundru Falls Viewpoint', date: 'Monsoon Season', description: 'For the best view of the waterfall in full flow, visit between 10 AM and 2 PM on a clear day.', type: 'info' },
  ];
  
  const handleMarketClick = (market: Market) => setSelectedMarket(market);
  const handleHotelClick = (hotel: Hotel) => setSelectedHotel(hotel);

  const navigateTo = (page: Page) => {
    setPageHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
  };

  const navigateBack = () => {
    const lastPage = pageHistory.pop();
    if (lastPage) {
      setPageHistory([...pageHistory]);
      setCurrentPage(lastPage);
    } else {
      setCurrentPage('home');
    }
  };
  
  // --- AUTHENTICATION HANDLERS ---
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setBookings([]);
    setCurrentPage('home');
  };
  
  const handleLogin = (username: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] && users[username] === pass) {
        localStorage.setItem('currentUser', username);
        setIsLoggedIn(true);
        setCurrentUser(username);
        setIsAuthModalOpen(false);

        const allBookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        setBookings(allBookings[username] || []);

        if (bookingDetails) {
            setNotification({ message: `Welcome! Please complete your booking.`, type: 'success' });
            setBookingFormDetails({ itemType: bookingDetails.itemType, itemName: bookingDetails.itemName });
            setBookingDetails(null);
            setSelectedGuide(null);
            setSelectedHotel(null);
        } else {
            setNotification({ message: `Welcome back, ${username}!`, type: 'success' });
        }
    } else {
        setNotification({ message: 'Invalid username or password.', type: 'error' });
    }
  };
  
  const handleRegister = (username: string, pass: string) => {
    if (!username || !pass) {
        setNotification({ message: 'Username and password cannot be empty.', type: 'error' });
        return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        setNotification({ message: 'Username already exists.', type: 'error' });
        return;
    }
    users[username] = pass;
    localStorage.setItem('users', JSON.stringify(users));

    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    bookings[username] = [];
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    setNotification({ message: 'Registration successful! Please log in.', type: 'success' });
    setAuthModalMode('login'); // Switch to login form
  };

  const handleBookingRequest = (itemType: 'Hotel' | 'Guide', itemName: string) => {
    if (isLoggedIn && currentUser) {
        setBookingFormDetails({ itemType, itemName });
    } else {
        setBookingDetails({ itemType, itemName });
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
    }
  };

  const handleFinalizeBooking = (details: Booking['details']) => {
    if (!bookingFormDetails || !currentUser) return;

    const newBooking: Booking = {
        type: bookingFormDetails.itemType,
        name: bookingFormDetails.itemName,
        bookingDate: new Date().toISOString(),
        details: details,
    };

    const allBookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    const userBookings = allBookings[currentUser] || [];
    userBookings.unshift(newBooking);
    allBookings[currentUser] = userBookings;

    localStorage.setItem('bookings', JSON.stringify(allBookings));
    setBookings(userBookings);

    setNotification({ message: `Booking for ${newBooking.name} confirmed!`, type: 'success' });

    // Reset states
    setBookingFormDetails(null);
    setSelectedGuide(null);
    setSelectedHotel(null);
  };


  // --- COMPONENTS ---

  const NotificationPopup = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void; }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); // Auto-close after 4 seconds
        return () => clearTimeout(timer);
    }, [message, onClose]);

    const successStyles = { backgroundColor: '#D4EDDA', color: '#155724', borderLeft: '5px solid #28A745' };
    const errorStyles = { backgroundColor: '#F8D7DA', color: '#721C24', borderLeft: '5px solid #DC3545' };
    const icon = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';

    return (
        <div style={{ ...styles.notificationPopup, ...(type === 'success' ? successStyles : errorStyles) }}>
            <i className={icon} style={{ marginRight: '10px', fontSize: '1.2rem' }}></i>
            <p style={{ margin: 0, flex: 1 }}>{message}</p>
            <button onClick={onClose} style={styles.notificationCloseBtn}>&times;</button>
        </div>
    );
  };

  const Navbar = ({ onNavClick, navigateTo, activePage, isLoggedIn, currentUser, onLoginClick, onLogoutClick }: { onNavClick: (page: Page) => void, navigateTo: (page: Page) => void, activePage: Page, isLoggedIn: boolean, currentUser: string | null, onLoginClick: () => void, onLogoutClick: () => void }) => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(event.target as Node)) { setIsProfileDropdownOpen(false); } };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
    <nav style={styles.navbar}>
      <div style={styles.navLogo} onClick={() => onNavClick('home')}>
        <span>Government Of Jharkhand</span>
      </div>
      <div style={styles.navLinks}>
        <a href="#" style={activePage === 'home' ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={(e) => { e.preventDefault(); onNavClick('home'); }}><span>Home</span></a>
        <a href="#hotels" style={activePage === 'hotels' ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={(e) => { e.preventDefault(); navigateTo('hotels'); }}><span>Hotels</span></a>
        <a href="#guides" style={activePage === 'guides' ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={(e) => { e.preventDefault(); navigateTo('guides'); }}><span>Guides</span></a>
        <a href="#maps" style={activePage === 'maps' ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={(e) => { e.preventDefault(); navigateTo('maps'); }}><span>Maps</span></a>
        <a href="#markets" style={activePage === 'markets' ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={(e) => { e.preventDefault(); navigateTo('markets'); }}><span>Local Market</span></a>
        {isLoggedIn && (
          <a href="#profile" style={activePage === 'userProfile' ? {...styles.navLink, ...styles.navLinkActive} : styles.navLink} onClick={(e) => { e.preventDefault(); navigateTo('userProfile'); }}><span>My Profile</span></a>
        )}
      </div>
       <div style={styles.navActions}>
          {isLoggedIn && currentUser ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                  <button onClick={() => setIsProfileDropdownOpen(p => !p)} style={{...styles.welcomeMessage, ...styles.profileButton}}>
                      Welcome, {currentUser}! <i className={`fa-solid fa-chevron-down ${isProfileDropdownOpen ? 'fa-rotate-180' : ''}`} style={{ marginLeft: '8px', transition: 'transform 0.2s' }}></i>
                  </button>
                  {isProfileDropdownOpen && (
                      <div style={styles.profileDropdown}>
                          <button onClick={() => { navigateTo('userProfile'); setIsProfileDropdownOpen(false); }} style={styles.profileDropdownItem}>My Profile</button>
                          <button onClick={() => { onLogoutClick(); setIsProfileDropdownOpen(false); }} style={styles.profileDropdownItem}>Logout</button>
                      </div>
                  )}
              </>
          ) : (
              <button onClick={onLoginClick} style={styles.authButton}>Login</button>
          )}
          <i className="fa-regular fa-bell" style={styles.navIcon} title="Notifications" onClick={() => setIsNotificationsOpen(p => !p)}></i>
          <i className="fa-solid fa-triangle-exclamation" style={{...styles.navIcon, color: '#ffc107'}} onClick={() => setIsSOSModalOpen(true)} title="SOS Emergency"></i>
        </div>
    </nav>
  );
  };
  
  const NotificationsDropdown = ({ items, onClose }: { items: NotificationItem[], onClose: () => void }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { onClose(); } };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const getIconForType = (type: NotificationType) => {
      switch (type) {
        case 'event': return { icon: "fa-solid fa-calendar-star", color: '#2E8B57' };
        case 'alert': return { icon: "fa-solid fa-traffic-cone", color: '#dc3545' };
        case 'announcement': return { icon: "fa-solid fa-bullhorn", color: '#007bff' };
        case 'info': return { icon: "fa-solid fa-circle-info", color: '#6c757d' };
        default: return { icon: "fa-solid fa-bell", color: '#333' };
      }
    };

    return (
        <div ref={dropdownRef} style={styles.notificationsDropdown}>
            <div style={styles.notificationsHeader}><h4>Notifications</h4></div>
            {items.length > 0 ? (
                items.map((item, index) => {
                    const { icon, color } = getIconForType(item.type);
                    return (
                        <div key={index} style={styles.notificationItem}>
                            <i className={icon} style={{ color, marginRight: '10px', fontSize: '1.2rem', width: '20px' }}></i>
                            <div>
                                <strong style={{...styles.notificationTitle, color}}>{item.name}</strong>
                                <p style={styles.notificationDate}>{item.date}</p>
                                <p style={styles.notificationDesc}>{item.description}</p>
                            </div>
                        </div>
                    );
                })
            ) : (<p style={{padding: '0 1rem'}}>No new notifications.</p>)}
        </div>
    );
  };

  const HeroSection = ({ onPlanClick }: { onPlanClick: () => void }) => {
    return (
        <header style={styles.heroContainer}>
            <div style={styles.heroOverlay}>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>Hidden Ecos of Jharkhand</h1>
                    <p style={styles.heroSubtitle}>Soul Of India</p>
                    <button style={styles.heroButton} onClick={onPlanClick}>Plan Your Adventure</button>
                </div>
            </div>
        </header>
    );
  };
  
  const PlaceGrid = ({ places, onPlaceClick }: { places: Place[]; onPlaceClick: (place: Place) => void }) => {
    const handleGetDirections = (e: React.MouseEvent, place: Place) => {
        e.stopPropagation(); // prevent modal from opening
        const query = `${place.name}, ${place.location}, Jharkhand`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, '_blank');
    };

    return (
        <div style={styles.trendingGrid}>
            {places.map((place, index) => (
                <div key={index} style={styles.placeCard} onClick={() => onPlaceClick(place)}>
                    <img src={place.image} alt={place.name} style={styles.placeImage}/>
                    <div style={styles.placeInfo}>
                        <div>
                            <h3 style={styles.placeName}>{place.name}</h3>
                            <p style={styles.placeLocation}>{place.location}</p>
                        </div>
                        <button style={styles.mapRedirectButton} onClick={(e) => handleGetDirections(e, place)} title="Get Directions">
                            <i className="fa-solid fa-map-location-dot"></i>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const HomePage = ({ onPlanClick }: { onPlanClick: () => void }) => (
    <>
      <HeroSection onPlanClick={onPlanClick}/>
      <main style={styles.main}>
        <section style={styles.trendingContainer}>
            <h2 style={styles.sectionTitle}>Trending Places</h2>
            <PlaceGrid places={trendingPlaces} onPlaceClick={setSelectedPlace} />
        </section>
        <section style={styles.trendingContainer}>
            <h2 style={styles.sectionTitle}>Visit Enchanted Echoes</h2>
            <PlaceGrid places={enchantedEchoes} onPlaceClick={setSelectedPlace} />
        </section>
        <section style={styles.trendingContainer}>
            <h2 style={styles.sectionTitle}>Hidden Cultural Treasures</h2>
            <PlaceGrid places={culturalTreasures} onPlaceClick={setSelectedPlace} />
        </section>
        <section style={styles.trendingContainer}>
            <h2 style={styles.sectionTitle}>Traditional Tribal Folks</h2>
            <PlaceGrid places={tribalFolks} onPlaceClick={setSelectedPlace} />
        </section>
        <section style={styles.trendingContainer}>
            <h2 style={styles.sectionTitle}>Eco-Tourism Hotspots</h2>
            <PlaceGrid places={ecoTourismPlaces} onPlaceClick={setSelectedPlace} />
        </section>
        <section style={styles.trendingContainer}>
          <h2 style={styles.sectionTitle}>Upcoming Festivals & Events</h2>
          <div style={styles.eventsGrid}>
            {notifications.filter(n => n.type === 'event').slice(0, 3).map((event, index) => (
              <div key={index} style={styles.eventCard}>
                <div style={styles.eventInfo}>
                  <h3 style={styles.eventName}>{event.name}</h3>
                  <p style={styles.eventDate}>{event.date}</p>
                  <p style={styles.eventDesc}>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );

  const FloatingButtons = ({ onChatbotClick }: { onChatbotClick: () => void }) => ( <div style={styles.fabContainer}><button style={styles.fab} onClick={onChatbotClick}><i className="fa-solid fa-robot"></i><span>AI Chatbot</span></button></div> );
  const Chatbot = ({ onClose }: { onClose: () => void }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'model' }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const languages = [ { code: 'en-IN', name: 'English' }, { code: 'hi-IN', name: 'Hindi' }, { code: 'sat-IN', name: 'Santhali' }, { code: 'bn-IN', name: 'Bengali' }, ];
    useEffect(() => {
        const initChat = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                const chatInstance = ai.chats.create({  model: 'gemini-2.5-flash', config: { systemInstruction: "You are a friendly and helpful travel assistant for Jharkhand, India. Provide concise and useful information to tourists. Answer in the language of the user's query.", }, });
                setChat(chatInstance);
                const welcomeMessage = "Hello! How can I help you plan your trip to Jharkhand today?";
                setMessages([{ text: welcomeMessage, sender: 'model' }]);
                speak(welcomeMessage, 'en-IN');
            } catch (error) { console.error("Failed to initialize chatbot:", error); setMessages([{ text: "Sorry, I'm having trouble connecting right now. Please try again later.", sender: 'model' }]); }
        };
        initChat();
        return () => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); } };
    }, []);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);
    const speak = (text: string, lang: string) => { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = lang; window.speechSynthesis.speak(utterance); } };
    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading || !chat) return;
        const userMessage = { text: messageText, sender: 'user' as const };
        setMessages(prev => [...prev, userMessage]); setInput(''); setIsLoading(true);
        try {
            const response = await chat.sendMessage({ message: messageText });
            const modelMessage = { text: response.text, sender: 'model' as const };
            setMessages(prev => [...prev, modelMessage]); speak(response.text, selectedLang);
        } catch (error) { console.error("Error sending message:", error); const errorMessage = "Oops! Something went wrong. Please try again."; setMessages(prev => [...prev, { text: errorMessage, sender: 'model' }]); speak(errorMessage, 'en-IN');
        } finally { setIsLoading(false); }
    };
    const toggleListen = () => {
        if (!SpeechRecognition) { alert("Sorry, your browser doesn't support speech recognition."); return; }
        if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
        if (isListening) { recognitionRef.current.stop(); setIsListening(false);
        } else {
            recognitionRef.current = new SpeechRecognition(); recognitionRef.current.lang = selectedLang; recognitionRef.current.continuous = false; recognitionRef.current.interimResults = false; recognitionRef.current.onstart = () => setIsListening(true); recognitionRef.current.onend = () => setIsListening(false); recognitionRef.current.onerror = (event: any) => { console.error('Speech recognition error:', event.error); setIsListening(false); }; recognitionRef.current.onresult = (event: any) => { const transcript = event.results[0][0].transcript; setInput(transcript); handleSendMessage(transcript); }; recognitionRef.current.start();
        }
    };
    return (
        <div style={styles.chatbotContainer}>
            <div style={styles.chatbotHeader}><h3 style={{margin: 0}}>AI Assistant</h3><select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} style={styles.langSelector}>{languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}</select><button onClick={onClose} style={styles.chatbotCloseBtn}>&times;</button></div>
            <div style={styles.chatbotMessages}> {messages.map((msg, index) => ( <div key={index} style={msg.sender === 'user' ? styles.userMessage : styles.modelMessage}>{msg.text}</div> ))} {isLoading && <div style={styles.modelMessage}><em>Typing...</em></div>} {isListening && <div style={styles.modelMessage}><em>Listening...</em></div>} <div ref={messagesEndRef} /> </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} style={styles.chatbotInputForm}> <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask or press mic to talk..." style={styles.chatbotInput} disabled={isLoading}/> <button type="button" onClick={toggleListen} style={{...styles.chatbotMicBtn, color: isListening ? '#f44336' : '#2E8B57'}}> <i className="fa-solid fa-microphone"></i> </button> <button type="submit" style={styles.chatbotSendBtn} disabled={isLoading}> <i className="fa-solid fa-paper-plane"></i> </button> </form>
        </div>
    );
  };
  
  const GuideProfileModal = ({ guide, onClose, onBookNow }: { guide: Guide, onClose: () => void, onBookNow: () => void }) => (
    <div style={styles.viewerOverlay} onClick={onClose}>
        <div style={{...styles.viewerModal, ...styles.guideModal}} onClick={e => e.stopPropagation()}>
            <div style={styles.viewerHeader}><h3>Guide Profile</h3><button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button></div>
            <div style={styles.guideModalContent}>
                <img src={guide.image} alt={guide.name} style={styles.guideModalImage} />
                <h2 style={styles.guideModalName}>{guide.name}</h2>
                <h4 style={styles.guideModalSpecialty}>{guide.specialty}</h4>
                
                <div style={styles.guideVerificationBadge}>
                    <i className="fa-solid fa-shield-check" style={{ fontSize: '1.8rem' }}></i>
                    <div>
                        <strong style={{ display: 'block' }}>Verified by Dept. of Tourism, Jharkhand</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Verification ID: {guide.verificationId}</p>
                    </div>
                </div>

                <div style={styles.guideModalMeta}>
                    <div style={styles.guideModalMetaItem}>
                        <i className="fa-solid fa-briefcase"></i>
                        <div>
                            <strong>Experience</strong>
                            <p>{guide.experience} years</p>
                        </div>
                    </div>
                    <div style={styles.guideModalMetaItem}>
                        <i className="fa-solid fa-language"></i>
                        <div>
                            <strong>Languages</strong>
                            <div style={{...styles.popularItemsGrid, marginTop: '0.25rem'}}>
                                {guide.languages.map(lang => <span key={lang} style={styles.popularItemTag}>{lang}</span>)}
                            </div>
                        </div>
                    </div>
                </div>

                <p style={styles.guideModalBio}>{guide.bio}</p>
                <button style={{...styles.heroButton, marginTop: '1rem'}} onClick={onBookNow}>Book Now</button>
            </div>
        </div>
    </div>
  );
  
  const HotelDetailModal = ({ hotel, onClose, onBookNow }: { hotel: Hotel, onClose: () => void, onBookNow: () => void }) => (
    <div style={styles.viewerOverlay} onClick={onClose}>
      <div style={{ ...styles.viewerModal, ...styles.guideModal }} onClick={e => e.stopPropagation()}>
        <div style={styles.viewerHeader}><h3>Hotel Details</h3><button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button></div>
        <div style={styles.marketModalContent}>
          <img src={hotel.image} alt={hotel.name} style={styles.marketModalImage} />
          <h2 style={styles.guideModalName}>{hotel.name}</h2>
          <h4 style={styles.guideModalSpecialty}>{hotel.location}</h4>
          <p style={styles.guideModalBio}>{hotel.description}</p>
          <div style={styles.popularItemsContainer}>
            <h5 style={styles.popularItemsTitle}>Amenities</h5>
            <div style={styles.popularItemsGrid}>{hotel.amenities.map((item, index) => (<span key={index} style={styles.popularItemTag}>{item}</span>))}</div>
          </div>
          <div style={{...styles.hotelDetails, justifyContent: 'center', gap: '2rem', marginTop: '1.5rem'}}>
            <span style={styles.hotelPrice}>₹{hotel.price.toLocaleString()}/night</span>
            <span style={styles.hotelRating}><i className="fa-solid fa-star" style={{ marginRight: '5px', color: '#FFD700' }}></i>{hotel.rating}</span>
          </div>
          <button style={{ ...styles.heroButton, marginTop: '1.5rem', width: '100%' }} onClick={onBookNow}>Book Now</button>
        </div>
      </div>
    </div>
  );

  const PageLayout = ({ title, children, onBack }: { title: string, children: React.ReactNode, onBack: () => void }) => (
    <main style={{...styles.main, paddingTop: '3rem'}}>
        <div style={styles.pageHeader}>
            <button onClick={onBack} style={styles.backButton}><i className="fa-solid fa-arrow-left" style={{marginRight: '8px'}}></i>Back</button>
            <h1 style={styles.pageTitle}>{title}</h1>
        </div>
        {children}
    </main>
  );

  const HotelsPage = ({ onHotelClick }: { onHotelClick: (hotel: Hotel) => void }) => (
    <PageLayout title="Hotels & Stays" onBack={navigateBack}>
      <div style={styles.hotelListContainer}>
        {hotels.map((hotel, index) => (
          <div key={index} style={styles.hotelCard} onClick={() => onHotelClick(hotel)}>
            <img src={hotel.image} alt={hotel.name} style={styles.hotelImage}/>
            <div style={styles.hotelInfo}>
              <h4 style={styles.hotelName}>{hotel.name}</h4>
              <p style={styles.hotelLocation}><i className="fa-solid fa-map-marker-alt" style={{ marginRight: '8px', color: '#777' }}></i>{hotel.location}</p>
              <div style={styles.hotelDetails}>
                <span style={styles.hotelPrice}>₹{hotel.price.toLocaleString()}/night</span>
                <span style={styles.hotelRating}><i className="fa-solid fa-star" style={{ marginRight: '5px', color: '#FFD700' }}></i>{hotel.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
  
  const GuidesPage = ({ onGuideClick }: { onGuideClick: (guide: Guide) => void }) => (
    <PageLayout title="Expert Local Guides" onBack={navigateBack}>
        <div style={styles.guideListContainer}>
            {guides.map((guide) => (
                <div key={guide.id} style={styles.guideListCard}>
                    <img src={guide.image} alt={guide.name} style={styles.guideListImage}/>
                    <div style={styles.guideListInfo}>
                        <h4 style={styles.guideName}>{guide.name} <i className="fa-solid fa-check-circle" style={{ marginLeft: '8px', color: '#2E8B57', fontSize: '1rem' }} title="Verified Guide"></i></h4>
                        <p style={styles.guideSpecialty}>{guide.specialty}</p>
                        <p style={styles.guideTagline}>"{guide.tagline}"</p>
                        <div style={styles.guideListMeta}>
                            <span><i className="fa-solid fa-briefcase" title="Experience"></i> {guide.experience} years</span>
                            <span><i className="fa-solid fa-language" title="Languages"></i> {guide.languages.slice(0, 2).join(', ')}</span>
                        </div>
                    </div>
                    <button style={styles.guideButton} onClick={() => onGuideClick(guide)}>View Profile</button>
                </div>
            ))}
        </div>
    </PageLayout>
  );

  const MapsPage = () => {
    const [mapUrl, setMapUrl] = useState('https://maps.google.com/maps?q=Jharkhand&t=&z=8&ie=UTF8&iwloc=&output=embed');
    const handleViewOnMap = (placeName: string, location: string) => { const query = `${placeName}, ${location}, Jharkhand`; setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`); };
    const handleGetDirections = (placeName: string, location: string) => { const query = `${placeName}, ${location}, Jharkhand`; window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, '_blank'); };
    return (
        <PageLayout title="Explore Jharkhand" onBack={navigateBack}>
            <div style={styles.mapsPageContainer}>
                <div style={styles.mapsPageMapView}><iframe src={mapUrl} width="100%" height="100%" style={{ border: 0, borderRadius: '15px' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe></div>
                <div style={styles.mapsPageSidebar}><h3 style={{ marginBottom: '1rem' }}>Popular Locations</h3><div style={styles.mapsContentContainer}>{trendingPlaces.map((place, index) => ( <div key={index} style={styles.mapsCard}><img src={place.image} alt={place.name} style={styles.mapsCardImage}/><div style={styles.mapsCardInfo}><h4 style={styles.mapsCardTitle}>{place.name}</h4><p style={styles.mapsCardDescription}>{place.description}</p><div style={styles.mapCardButtons}><button style={styles.mapCardButton} onClick={() => handleViewOnMap(place.name, place.location)}>View on Map</button><button style={styles.mapCardButton} onClick={() => handleGetDirections(place.name, place.location)}>Directions</button></div></div></div>))}</div></div>
            </div>
        </PageLayout>
    );
  };

  const LocalMarketsPage = ({ onMarketClick }: { onMarketClick: (market: Market) => void }) => (
    <PageLayout title="Local Markets" onBack={navigateBack}>
        <div style={styles.marketListContainer}>{localMarkets.map((market, index) => ( <div key={index} style={styles.marketCard} onClick={() => onMarketClick(market)}><img src={market.image} alt={market.name} style={styles.marketImage}/><div style={styles.marketInfo}><h4 style={styles.marketName}>{market.name}</h4><p style={styles.marketLocation}><i className="fa-solid fa-map-marker-alt" style={{ marginRight: '8px', color: '#777' }}></i>{market.location}</p><p style={styles.marketDescription}>{market.description}</p></div></div>))}</div>
    </PageLayout>
  );

  const PlanAdventurePage = () => {
    const [itineraryData, setItineraryData] = useState<ItineraryDay[] | null>(null);
    const [itineraryError, setItineraryError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    
    const durationRef = useRef<HTMLInputElement>(null);
    const budgetRef = useRef<HTMLSelectElement>(null);
    const notesRef = useRef<HTMLTextAreaElement>(null);

    const interestsOptions = [
      { name: 'Wildlife', icon: 'fa-solid fa-paw' },
      { name: 'Eco-Tourism', icon: 'fa-solid fa-leaf' },
      { name: 'Spiritual', icon: 'fa-solid fa-om' },
      { name: 'Culture & Heritage', icon: 'fa-solid fa-gopuram' },
      { name: 'Adventure & Trekking', icon: 'fa-solid fa-person-hiking' },
      { name: 'Relaxation', icon: 'fa-solid fa-bed' }
    ];

    const handleInterestToggle = (interest: string) => {
        setSelectedInterests(prev => 
            prev.includes(interest) 
            ? prev.filter(i => i !== interest)
            : [...prev, interest]
        );
    };

    const handleGenerateItinerary = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setItineraryData(null);
        setItineraryError('');

        const interests = selectedInterests.join(', ');
        const duration = durationRef.current?.value;
        const budget = budgetRef.current?.value;
        const notes = notesRef.current?.value;

        if (selectedInterests.length === 0) {
          setItineraryError("Please select at least one interest to generate an itinerary.");
          setIsLoading(false);
          return;
        }

        const itinerarySchema = {
          type: Type.OBJECT,
          properties: {
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: 'The day number, e.g., "Day 1"' },
                  title: { type: Type.STRING, description: 'A brief, catchy title for the day\'s plan.' },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING, description: 'Time of day (e.g., Morning, Afternoon, 8:00 AM).' },
                        description: { type: Type.STRING, description: 'Description of the activity.' },
                        type: { type: Type.STRING, description: 'Category of activity (e.g., Sightseeing, Food, Travel, Stay).' }
                      }
                    }
                  }
                }
              }
            }
          }
        };

        const prompt = `You are an expert travel planner for Jharkhand, India. Create a detailed and practical day-by-day itinerary based on these preferences:
        - Interests: ${interests || 'General sightseeing'}
        - Trip Duration: ${duration} days
        - Budget per Person: ${budget}
        - Additional Notes: ${notes || 'None'}
        Provide a structured plan. For each activity, suggest a time and a brief description. Also categorize each activity as 'Sightseeing', 'Food', 'Travel', or 'Stay'.`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: itinerarySchema,
                },
            });
            const parsedResponse = JSON.parse(response.text);
            setItineraryData(parsedResponse.itinerary);
        } catch (error) {
            console.error("Error generating itinerary:", error);
            setItineraryError("Sorry, we couldn't generate an itinerary. The model might be busy or the request could not be fulfilled. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const ItineraryDisplay = ({ data }: { data: ItineraryDay[] }) => {
      const getActivityIcon = (type: string) => {
          switch (type?.toLowerCase()) {
              case 'sightseeing': return 'fa-solid fa-camera-retro';
              case 'food': return 'fa-solid fa-utensils';
              case 'travel': return 'fa-solid fa-car-side';
              case 'stay': return 'fa-solid fa-bed';
              default: return 'fa-solid fa-location-dot';
          }
      };
  
      return (
          <div style={styles.itineraryResultContainer}>
              <h3 style={styles.itineraryTitle}>Your Custom Itinerary</h3>
              <div style={styles.itineraryTimeline}>
                  {data.map((day, index) => (
                      <div key={index} style={styles.itineraryDay}>
                          <div style={styles.itineraryDayHeader}>
                              <span style={styles.itineraryDayNumber}>{day.day}</span>
                              <h4 style={styles.itineraryDayTitle}>{day.title}</h4>
                          </div>
                          <div style={styles.itineraryDayContent}>
                              {day.activities.map((activity, actIndex) => (
                                  <div key={actIndex} style={styles.itineraryActivity}>
                                      <div style={styles.itineraryActivityIconWrapper}>
                                          <i className={getActivityIcon(activity.type)} style={styles.itineraryActivityIcon}></i>
                                      </div>
                                      <div style={styles.itineraryActivityDetails}>
                                          <p style={styles.itineraryActivityTime}>{activity.time}</p>
                                          <p style={styles.itineraryActivityDesc}>{activity.description}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
    };

    return (
        <PageLayout title="Plan Your Adventure" onBack={navigateBack}>
            <div style={styles.planPageContainer}>
                <p style={{textAlign: 'center', marginBottom: '2.5rem', fontSize: '1.1rem', color: '#555'}}>Tell us your preferences, and our AI will craft the perfect Jharkhand trip for you!</p>
                <form onSubmit={handleGenerateItinerary} style={styles.planForm}>
                    <div style={styles.planStep}>
                      <h4 style={styles.planStepTitle}>1. Choose Your Vibe</h4>
                      <div style={styles.planInterestGrid}>
                        {interestsOptions.map(interest => (
                          <div 
                            key={interest.name} 
                            style={selectedInterests.includes(interest.name) ? {...styles.planInterestCard, ...styles.planInterestCardSelected} : styles.planInterestCard}
                            onClick={() => handleInterestToggle(interest.name)}
                          >
                            <i className={interest.icon} style={styles.planInterestIcon}></i>
                            <span>{interest.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={styles.planStep}>
                      <h4 style={styles.planStepTitle}>2. Set Your Timeline & Budget</h4>
                      <div style={styles.planFormRow}>
                          <div style={styles.planFormControl}><label htmlFor="duration">Trip Duration (days)</label><input ref={durationRef} type="number" id="duration" name="duration" defaultValue="3" min="1" required/></div>
                          <div style={styles.planFormControl}><label htmlFor="budget">Budget per Person</label><select ref={budgetRef} id="budget" name="budget"><option>Economy (Under ₹5,000)</option><option>Mid-Range (₹5,000 - ₹15,000)</option><option>Luxury (Above ₹15,000)</option></select></div>
                      </div>
                    </div>

                    <div style={styles.planStep}>
                      <h4 style={styles.planStepTitle}>3. Add a Personal Touch</h4>
                      <div style={styles.planFormControl}><label htmlFor="notes">Additional Notes (Optional)</label><textarea ref={notesRef} id="notes" name="notes" rows={3} placeholder="e.g., 'I want to see the sunset at Netarhat' or 'Avoid spicy food'"></textarea></div>
                    </div>
                    
                    <button type="submit" style={{...styles.heroButton, width: '100%', marginTop: '1rem', fontSize: '1.2rem', padding: '1rem'}} disabled={isLoading}>
                      {isLoading ? <div style={styles.loader}></div> : 'Generate Itinerary'}
                    </button>
                </form>

                {itineraryError && <p style={styles.itineraryError}>{itineraryError}</p>}

                {itineraryData && <ItineraryDisplay data={itineraryData} />}
            </div>
        </PageLayout>
    );
  };
  
  const SOSModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('police');
    const renderContent = () => {
      switch (activeTab) {
        case 'police': return ( <div style={styles.sosSection}> <div style={styles.sosSectionHeader}><i className="fa-solid fa-shield-halved" style={{fontSize: '2rem', color: '#007bff'}}></i><h3>Police Assistance</h3></div> <a href="tel:100" style={{...styles.sosDialButton, backgroundColor: '#007bff'}}>DIAL 100</a> <button style={styles.sosFindButton} onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=police+station+near+me', '_blank')}>Find Nearest Police Station</button> <h4 style={{margin: '0.5rem 0 0.25rem 0', textAlign: 'left'}}>Important Numbers:</h4> <ul style={styles.sosContactList}>{policeStations.map((p, i) => <li key={i} style={styles.sosContactItem}><strong>{p.name}:</strong> <a href={`tel:${p.phone}`} style={styles.sosContactLink}>{p.phone}</a></li>)}</ul> </div> );
        case 'fire': return ( <div style={styles.sosSection}> <div style={styles.sosSectionHeader}><i className="fa-solid fa-fire-flame-curved" style={{fontSize: '2rem', color: '#dc3545'}}></i><h3>Fire & Rescue</h3></div> <a href="tel:101" style={{...styles.sosDialButton, backgroundColor: '#dc3545'}}>DIAL 101</a> <button style={styles.sosFindButton} onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=fire+station+near+me', '_blank')}>Find Nearest Fire Station</button> <h4 style={{margin: '0.5rem 0 0.25rem 0', textAlign: 'left'}}>Important Numbers:</h4> <ul style={styles.sosContactList}>{fireStations.map((f, i) => <li key={i} style={styles.sosContactItem}><strong>{f.name}:</strong> <a href={`tel:${f.phone}`} style={styles.sosContactLink}>{f.phone}</a></li>)}</ul> </div> );
        case 'medical': return ( <div style={styles.sosSection}> <div style={styles.sosSectionHeader}><i className="fa-solid fa-briefcase-medical" style={{fontSize: '2rem', color: '#28a745'}}></i><h3>Medical Emergency</h3></div> <a href="tel:108" style={{...styles.sosDialButton, backgroundColor: '#28a745'}}>DIAL 108 (Ambulance)</a> <button style={styles.sosFindButton} onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=hospital+near+me', '_blank')}>Find Nearest Hospital</button> <h4 style={{margin: '0.5rem 0 0.25rem 0', textAlign: 'left'}}>Important Numbers:</h4> <ul style={styles.sosContactList}>{hospitals.map((h, i) => <li key={i} style={styles.sosContactItem}><strong>{h.name}:</strong> <a href={`tel:${h.phone}`} style={styles.sosContactLink}>{h.phone}</a></li>)}</ul> </div> );
        default: return null;
      }
    };
    return (
      <div style={styles.viewerOverlay} onClick={onClose}>
        <div style={{...styles.viewerModal, maxWidth: '500px', height: 'auto', maxHeight: '90vh'}} onClick={e => e.stopPropagation()}>
          <div style={styles.viewerHeader}> <h3 style={{color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><i className="fa-solid fa-triangle-exclamation"></i>Emergency SOS</h3> <button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button> </div>
          <div style={styles.sosModalContainer}><div style={styles.sosModalTabs}><button style={activeTab === 'police' ? {...styles.sosModalTab, ...styles.sosModalTabActive} : styles.sosModalTab} onClick={() => setActiveTab('police')}>Police</button><button style={activeTab === 'fire' ? {...styles.sosModalTab, ...styles.sosModalTabActive} : styles.sosModalTab} onClick={() => setActiveTab('fire')}>Fire</button><button style={activeTab === 'medical' ? {...styles.sosModalTab, ...styles.sosModalTabActive} : styles.sosModalTab} onClick={() => setActiveTab('medical')}>Medical</button></div><div style={styles.sosModalContent}>{renderContent()}</div></div>
        </div>
      </div>
    );
  };

  const AuthModal = ({ mode, onClose, onLogin, onRegister, onSwitchMode }: { 
      mode: 'login' | 'register', 
      onClose: () => void,
      onLogin: (u: string, p: string) => void,
      onRegister: (u: string, p: string) => void,
      onSwitchMode: (m: 'login' | 'register') => void 
  }) => {
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const isLogin = mode === 'login';
  
      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (isLogin) {
              onLogin(username, password);
          } else {
              onRegister(username, password);
          }
      };
  
      return (
          <div style={styles.viewerOverlay} onClick={onClose}>
              <div style={{...styles.viewerModal, maxWidth: '400px', height: 'auto' }} onClick={e => e.stopPropagation()}>
                  <div style={styles.viewerHeader}>
                      <h3>{isLogin ? 'Login' : 'Register'}</h3>
                      <button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button>
                  </div>
                  <form onSubmit={handleSubmit} style={styles.authForm}>
                      <p style={{textAlign: 'center', marginTop: 0, color: '#555'}}>{isLogin ? 'Welcome back! Please enter your details.' : 'Create an account to get started.'}</p>
                      <div style={styles.authFormControl}>
                          <label htmlFor="username">Username</label>
                          <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required style={styles.authInput}/>
                      </div>
                      <div style={styles.authFormControl}>
                          <label htmlFor="password">Password</label>
                          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.authInput}/>
                      </div>
                      <button type="submit" style={{...styles.heroButton, width: '100%', marginTop: '1rem'}}>
                          {isLogin ? 'Login' : 'Create Account'}
                      </button>
                      <p style={styles.authSwitchText}>
                          {isLogin ? "Don't have an account?" : "Already have an account?"}
                          <button type="button" onClick={() => onSwitchMode(isLogin ? 'register' : 'login')} style={styles.authSwitchButton}>
                              {isLogin ? 'Register' : 'Login'}
                          </button>
                      </p>
                  </form>
              </div>
          </div>
      );
  };
  
  const MarketDetailModal = ({ market, onClose }: { market: Market, onClose: () => void }) => {
    const handleGetDirections = () => { const query = `${market.name}, ${market.location}`; window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, '_blank'); };
    return (
        <div style={styles.viewerOverlay} onClick={onClose}>
            <div style={{...styles.viewerModal, ...styles.guideModal}} onClick={e => e.stopPropagation()}>
                <div style={styles.viewerHeader}><h3>Market Details</h3><button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button></div>
                <div style={styles.marketModalContent}><img src={market.image} alt={market.name} style={styles.marketModalImage} /><h2 style={styles.guideModalName}>{market.name}</h2><h4 style={styles.guideModalSpecialty}>{market.location}</h4><p style={styles.guideModalBio}>{market.description}</p><div style={styles.popularItemsContainer}><h5 style={styles.popularItemsTitle}>Popular Items</h5><div style={styles.popularItemsGrid}>{market.popularItems.map((item, index) => (<span key={index} style={styles.popularItemTag}>{item}</span>))}</div></div><button style={{...styles.heroButton, marginTop: '1rem', width: '100%'}} onClick={handleGetDirections}>Get Directions</button></div>
            </div>
        </div>
    );
  };

  const PlaceDetailModal = ({ place, onClose }: { place: Place, onClose: () => void }) => {
    const handleGetDirections = () => {
        const query = `${place.name}, ${place.location}, Jharkhand`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`, '_blank');
    };
    return (
        <div style={styles.viewerOverlay} onClick={onClose}>
            <div style={{...styles.viewerModal, ...styles.guideModal}} onClick={e => e.stopPropagation()}>
                <div style={styles.viewerHeader}><h3>Place Details</h3><button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button></div>
                <div style={styles.marketModalContent}>
                    <img src={place.image} alt={place.name} style={styles.marketModalImage} />
                    <h2 style={styles.guideModalName}>{place.name}</h2>
                    <h4 style={styles.guideModalSpecialty}>{place.location}</h4>
                    <p style={styles.guideModalBio}>{place.description}</p>
                    <button style={{...styles.heroButton, marginTop: '1rem', width: '100%'}} onClick={handleGetDirections}>Get Directions</button>
                </div>
            </div>
        </div>
    );
  };

  const BookingFormModal = ({ itemType, itemName, onConfirm, onClose }: {
    itemType: 'Hotel' | 'Guide';
    itemName: string;
    onConfirm: (details: Booking['details']) => void;
    onClose: () => void;
  }) => {
      const [checkIn, setCheckIn] = useState('');
      const [checkOut, setCheckOut] = useState('');
      const [guests, setGuests] = useState(1);
      const [tourDate, setTourDate] = useState('');
      const [groupSize, setGroupSize] = useState(1);
      const [notes, setNotes] = useState('');
  
      const today = new Date().toISOString().split('T')[0];
  
      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          let details: Booking['details'] = {};
          if (itemType === 'Hotel') {
              if (!checkIn || !checkOut) {
                  setNotification({ message: 'Please select check-in and check-out dates.', type: 'error' });
                  return;
              }
              if (new Date(checkIn) >= new Date(checkOut)) {
                  setNotification({ message: 'Check-out date must be after the check-in date.', type: 'error' });
                  return;
              }
              details = { checkIn, checkOut, guests: Number(guests), notes };
          } else { // Guide
               if (!tourDate) {
                  setNotification({ message: 'Please select a tour date.', type: 'error' });
                  return;
              }
              details = { tourDate, groupSize: Number(groupSize), notes };
          }
          onConfirm(details);
      };
  
      return (
          <div style={styles.viewerOverlay} onClick={onClose}>
              <div style={{...styles.viewerModal, maxWidth: '500px', height: 'auto'}} onClick={e => e.stopPropagation()}>
                  <div style={styles.viewerHeader}>
                      <h3>Book {itemType}: {itemName}</h3>
                      <button onClick={onClose} style={styles.viewerCloseBtn}>&times;</button>
                  </div>
                  <form onSubmit={handleSubmit} style={styles.authForm}>
                      {itemType === 'Hotel' && (
                          <>
                              <div style={styles.planFormRow}>
                                  <div style={styles.authFormControl}>
                                      <label htmlFor="checkIn">Check-in Date</label>
                                      <input type="date" id="checkIn" value={checkIn} onChange={e => setCheckIn(e.target.value)} required min={today} style={styles.authInput}/>
                                  </div>
                                  <div style={styles.authFormControl}>
                                      <label htmlFor="checkOut">Check-out Date</label>
                                      <input type="date" id="checkOut" value={checkOut} onChange={e => setCheckOut(e.target.value)} required min={checkIn || today} style={styles.authInput}/>
                                  </div>
                              </div>
                               <div style={styles.authFormControl}>
                                  <label htmlFor="guests">Number of Guests</label>
                                  <input type="number" id="guests" value={guests} onChange={e => setGuests(parseInt(e.target.value, 10))} required min="1" style={styles.authInput}/>
                              </div>
                          </>
                      )}
                      {itemType === 'Guide' && (
                          <>
                              <div style={styles.authFormControl}>
                                  <label htmlFor="tourDate">Tour Date</label>
                                  <input type="date" id="tourDate" value={tourDate} onChange={e => setTourDate(e.target.value)} required min={today} style={styles.authInput}/>
                              </div>
                              <div style={styles.authFormControl}>
                                  <label htmlFor="groupSize">Group Size</label>
                                  <input type="number" id="groupSize" value={groupSize} onChange={e => setGroupSize(parseInt(e.target.value, 10))} required min="1" style={styles.authInput}/>
                              </div>
                          </>
                      )}
                      <div style={styles.authFormControl}>
                          <label htmlFor="notes">Additional Notes (Optional)</label>
                          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{...styles.authInput, resize: 'vertical'}} placeholder="e.g., specific requests, allergies, etc."></textarea>
                      </div>
                      <button type="submit" style={{...styles.heroButton, width: '100%', marginTop: '1rem'}}>
                          Confirm Booking
                      </button>
                  </form>
              </div>
          </div>
      );
  };

  const UserProfilePage = ({ user, bookings }: { user: string | null; bookings: Booking[] }) => {
    const dashboardStats = useMemo(() => {
        let moneySpent = 0;
        let hoursSpent = 0;

        bookings.forEach(booking => {
            if (booking.type === 'Hotel' && booking.details.checkIn && booking.details.checkOut) {
                const hotel = hotels.find(h => h.name === booking.name);
                if (hotel) {
                    const checkInDate = new Date(booking.details.checkIn);
                    const checkOutDate = new Date(booking.details.checkOut);
                    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
                    if (nights > 0) {
                        moneySpent += nights * hotel.price;
                        hoursSpent += nights * 24;
                    }
                }
            } else if (booking.type === 'Guide') {
                // Assumption: A guide booking costs 4000 and is an 8-hour tour
                moneySpent += 4000;
                hoursSpent += 8;
            }
        });

        return {
            totalBookings: bookings.length,
            moneySpent: moneySpent.toLocaleString('en-IN'),
            hoursSpent,
        };
    }, [bookings]);
    
    return (
    <PageLayout title="My Dashboard" onBack={navigateBack}>
        <div style={styles.profilePageContainer}>
            <div style={styles.profileDetailsCard}>
                <i className="fa-solid fa-circle-user" style={{ fontSize: '4rem', color: '#1A4D2E' }}></i>
                <h2 style={{ margin: '1rem 0 0.5rem 0', color: '#1A4D2E' }}>Welcome, {user}!</h2>
                <p style={{ margin: 0, color: '#555' }}>Here is a summary of your adventures in Jharkhand.</p>
            </div>

            <div style={styles.dashboardStatsGrid}>
                <div style={styles.statCard}>
                    <div style={styles.statCardIcon}><i className="fa-solid fa-briefcase"></i></div>
                    <div style={styles.statCardContent}>
                        <h4 style={styles.statCardTitle}>Total Bookings</h4>
                        <p style={styles.statCardValue}>{dashboardStats.totalBookings}</p>
                    </div>
                </div>
                 <div style={styles.statCard}>
                    <div style={styles.statCardIcon}><i className="fa-solid fa-indian-rupee-sign"></i></div>
                    <div style={styles.statCardContent}>
                        <h4 style={styles.statCardTitle}>Est. Money Spent</h4>
                        <p style={styles.statCardValue}>₹{dashboardStats.moneySpent}</p>
                    </div>
                </div>
                 <div style={styles.statCard}>
                    <div style={styles.statCardIcon}><i className="fa-solid fa-clock"></i></div>
                    <div style={styles.statCardContent}>
                        <h4 style={styles.statCardTitle}>Hours Explored</h4>
                        <p style={styles.statCardValue}>{dashboardStats.hoursSpent} hrs</p>
                    </div>
                </div>
            </div>

            <div style={styles.profileBookingsSection}>
                <h3 style={styles.profileSectionTitle}>My Booking History</h3>
                {bookings.length > 0 ? (
                    <div style={styles.bookingsGrid}>
                        {bookings.map((booking, index) => (
                            <div key={index} style={styles.bookingCard}>
                                <div style={styles.bookingCardIcon}>
                                    <i className={`fa-solid ${booking.type === 'Hotel' ? 'fa-hotel' : 'fa-user-check'}`}></i>
                                </div>
                                <div style={styles.bookingCardInfo}>
                                    <span style={styles.bookingCardType}>{booking.type} Booking</span>
                                    <h4 style={styles.bookingCardName}>{booking.name}</h4>
                                     <div style={styles.bookingCardDetails}>
                                        {booking.type === 'Hotel' && booking.details ? (
                                            <>
                                                <span><i className="fa-solid fa-calendar-check" title="Check-in"></i> {booking.details.checkIn}</span>
                                                <span><i className="fa-solid fa-calendar-times" title="Check-out"></i> {booking.details.checkOut}</span>
                                                <span><i className="fa-solid fa-users" title="Guests"></i> {booking.details.guests} Guests</span>
                                            </>
                                        ) : booking.type === 'Guide' && booking.details ? (
                                            <>
                                                <span><i className="fa-solid fa-calendar-day" title="Tour Date"></i> {booking.details.tourDate}</span>
                                                <span><i className="fa-solid fa-users" title="Group Size"></i> {booking.details.groupSize} People</span>
                                            </>
                                        ) : null}
                                    </div>
                                    {booking.details.notes && <p style={styles.bookingCardNotes}><strong>Notes:</strong> {booking.details.notes}</p>}
                                    <p style={styles.bookingCardDate}>Booked on: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', color: '#777', marginTop: '2rem' }}>You have no bookings yet. Start exploring!</p>
                )}
            </div>
        </div>
    </PageLayout>
    );
  };

  const Footer = () => (
    <footer style={styles.footer}><div style={styles.footerCopyright}>© 2025 Jharkhand Darshan. All Rights Reserved.</div><div style={styles.footerLinksContainer}><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={styles.footerLink}><i className="fa-brands fa-facebook-f" style={styles.footerSocialIcon}></i></a><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={styles.footerLink}><i className="fa-brands fa-twitter" style={styles.footerSocialIcon}></i></a><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={styles.footerLink}><i className="fa-brands fa-instagram" style={styles.footerSocialIcon}></i></a><a href="mailto:contact@jharkhandtourism.gov" style={styles.footerLink}>Contact Us</a></div></footer>
  );
  
  const renderPage = () => {
    switch (currentPage) {
        case 'home': return <HomePage onPlanClick={() => navigateTo('plan')} />;
        case 'hotels': return <HotelsPage onHotelClick={handleHotelClick} />;
        case 'guides': return <GuidesPage onGuideClick={setSelectedGuide} />;
        case 'maps': return <MapsPage />;
        case 'markets': return <LocalMarketsPage onMarketClick={handleMarketClick} />;
        case 'plan': return <PlanAdventurePage />;
        case 'userProfile': return <UserProfilePage user={currentUser} bookings={bookings} />;
        default: return <HomePage onPlanClick={() => navigateTo('plan')} />;
    }
  };

  return (
    <>
      <Navbar 
        onNavClick={(page) => { setPageHistory([]); setCurrentPage(page); }} 
        navigateTo={navigateTo}
        activePage={currentPage}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLoginClick={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
        }}
        onLogoutClick={handleLogout}
      />
      {isNotificationsOpen && <NotificationsDropdown items={notifications} onClose={() => setIsNotificationsOpen(false)} />}
      {notification && <NotificationPopup message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      
      {renderPage()}
      
      <Footer />
      <FloatingButtons onChatbotClick={() => setIsChatbotOpen(true)} />

      {isChatbotOpen && <Chatbot onClose={() => setIsChatbotOpen(false)} />}
      {selectedGuide && <GuideProfileModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} onBookNow={() => handleBookingRequest('Guide', selectedGuide.name)} />}
      {selectedHotel && <HotelDetailModal hotel={selectedHotel} onClose={() => setSelectedHotel(null)} onBookNow={() => handleBookingRequest('Hotel', selectedHotel.name)} />}
      {isSOSModalOpen && <SOSModal onClose={() => setIsSOSModalOpen(false)} />}
      {selectedMarket && <MarketDetailModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />}
      {selectedPlace && <PlaceDetailModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
      {isAuthModalOpen && <AuthModal mode={authModalMode} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} onSwitchMode={setAuthModalMode} />}
      {bookingFormDetails && <BookingFormModal itemType={bookingFormDetails.itemType} itemName={bookingFormDetails.itemName} onConfirm={handleFinalizeBooking} onClose={() => setBookingFormDetails(null)} />}
    </>
  );
};

// --- STYLES OBJECT ---
const styles: { [key: string]: React.CSSProperties } = {
  // --- Main Layout ---
  main: { padding: '2rem 5%', backgroundColor: '#FFFFFF', flex: '1' },
  pageHeader: { position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem' },
  backButton: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', color: '#555' },
  pageTitle: { fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#1A4D2E', textAlign: 'center' },
  
  // --- Navbar ---
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 5%', backgroundColor: '#FFFFFF', color: '#1A4D2E', flexWrap: 'wrap', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 },
  navLogo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' },
  navLinks: { display: 'flex', gap: '2rem', marginRight: 'auto', marginLeft: '2rem' },
  navLink: { color: '#333', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', padding: '0.5rem 0', borderBottom: '2px solid transparent' },
  navLinkActive: { color: '#2E8B57', borderBottom: '2px solid #2E8B57' },
  navActions: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  navIcon: { fontSize: '1.2rem', cursor: 'pointer', color: '#333' },
  welcomeMessage: { fontSize: '0.9rem', color: '#555', fontWeight: '500' },
  authButton: { backgroundColor: '#2E8B57', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
  profileButton: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  profileDropdown: { position: 'absolute', top: '120%', right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10000, overflow: 'hidden', minWidth: '150px' },
  profileDropdownItem: { display: 'block', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem' },
  
  // --- Notifications Dropdown ---
  notificationsDropdown: { position: 'absolute', top: '70px', right: '5%', width: '350px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 1100, overflow: 'hidden' },
  notificationsHeader: { padding: '1rem', borderBottom: '1px solid #eee', backgroundColor: '#F8F9FA' },
  notificationItem: { padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'flex-start' },
  notificationTitle: { fontWeight: 'bold' },
  notificationDate: { fontSize: '0.8rem', color: '#777', margin: '0.25rem 0' },
  notificationDesc: { fontSize: '0.9rem', margin: 0, lineHeight: 1.4 },
  
  // --- Notification Popup ---
  notificationPopup: { position: 'fixed', top: '80px', right: '20px', minWidth: '300px', maxWidth: '400px', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'slideIn 0.5s ease-out' },
  notificationCloseBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: '0 0.5rem' },

  // --- Hero Section ---
  heroContainer: { 
    position: 'relative', 
    height: '450px', 
    width: '100%', 
    overflow: 'hidden', 
    backgroundSize: 'cover', 
    backgroundPosition: 'center center',
    backgroundImage: `url('https://uploads.onecompiler.io/43xfqcbsu/43xgk4jut/pexels-pixabay-414061.jpg')`
  },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '5%' },
  heroContent: { color: 'white', textAlign: 'left' },
  heroTitle: { fontSize: '3rem', margin: '0', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' },
  heroSubtitle: { fontSize: '1.2rem', margin: '0.5rem 0 1.5rem 0' },
  heroButton: { backgroundColor: '#2E8B57', color: 'white', padding: '0.8rem 1.8rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },

  // --- Sections ---
  sectionTitle: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1A4D2E', textAlign: 'left' },
  
  // --- Trending & Eco Places ---
  trendingContainer: { marginBottom: '3rem' },
  trendingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
  placeCard: { backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  placeImage: { width: '100%', height: '180px', objectFit: 'cover' },
  placeInfo: { padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  placeName: { margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#1A4D2E' },
  placeLocation: { margin: '0', fontSize: '0.9rem', color: '#777' },
  placeDescription: { margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: 1.5, marginTop: 'auto' },
  mapRedirectButton: { background: '#D2E3C8', color: '#1A4D2E', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' },

  // --- Events Section (Homepage) ---
  eventsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  eventCard: { backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '1.5rem', borderLeft: '5px solid #2E8B57' },
  eventInfo: {},
  eventName: { margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#1A4D2E' },
  eventDate: { margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#555', fontWeight: 'bold' },
  eventDesc: { margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: 1.5 },
  
  // --- Guides Section (Shared styles) ---
  guideName: { margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#1A4D2E' },
  guideSpecialty: { margin: '0', fontSize: '0.9rem', color: '#777' },
  guideButton: { backgroundColor: '#333', color: 'white', padding: '0.6rem 1.5rem', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' },

  // --- Floating Action Buttons ---
  fabContainer: { position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000 },
  fab: { backgroundColor: '#fff', color: '#1A4D2E', border: '1px solid #ccc', borderRadius: '50px', padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', fontWeight: '500' },

  // --- Chatbot ---
  chatbotContainer: { position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 1001 },
  chatbotHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', backgroundColor: '#1A4D2E', color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' },
  langSelector: { backgroundColor: '#4F6F52', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' },
  chatbotCloseBtn: { background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' },
  chatbotMessages: { flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#D2E3C8', color: '#333', padding: '0.5rem 1rem', borderRadius: '15px 15px 0 15px', maxWidth: '80%' },
  modelMessage: { alignSelf: 'flex-start', backgroundColor: '#F8F9FA', color: '#333', padding: '0.5rem 1rem', borderRadius: '15px 15px 15px 0', maxWidth: '80%' },
  chatbotInputForm: { display: 'flex', padding: '0.5rem', borderTop: '1px solid #eee', alignItems: 'center' },
  chatbotInput: { flex: 1, border: 'none', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#f0f0f0' },
  chatbotMicBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem' },
  chatbotSendBtn: { background: 'none', border: 'none', color: '#2E8B57', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem 1rem' },

  // --- Viewer/Modal Base ---
  viewerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  viewerModal: { backgroundColor: 'white', borderRadius: '15px', width: '90%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  viewerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', borderBottom: '1px solid #eee' },
  viewerCloseBtn: { background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#555' },

  // --- Guide & Hotel Modal ---
  guideModal: { height: 'auto', maxHeight: '90vh', maxWidth: '500px' },
  guideModalContent: { padding: '2rem', textAlign: 'center', overflowY: 'auto' },
  guideModalImage: { width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #2E8B57', marginBottom: '1rem' },
  guideModalName: { margin: '0', fontSize: '1.8rem', color: '#1A4D2E' },
  guideModalSpecialty: { margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#777', fontWeight: 'normal' },
  guideVerificationBadge: { display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#E6F4EA', color: '#1A4D2E', padding: '0.75rem 1rem', borderRadius: '8px', margin: '1.5rem 0', textAlign: 'left', border: '1px solid #D2E3C8' },
  guideModalBio: { fontSize: '1rem', color: '#555', lineHeight: '1.6', textAlign: 'left', marginTop: '1.5rem' },
  guideModalMeta: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', textAlign: 'left', backgroundColor: '#F8F9FA', padding: '1rem', borderRadius: '8px' },
  guideModalMetaItem: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' },

  // --- Hotels Page ---
  hotelListContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' },
  hotelCard: { display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' },
  hotelImage: { width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover' },
  hotelInfo: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  hotelName: { margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1A4D2E' },
  hotelLocation: { margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#555' },
  hotelDetails: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' },
  hotelPrice: { fontSize: '1.1rem', fontWeight: 'bold', color: '#2E8B57' },
  hotelRating: { fontSize: '1rem', fontWeight: 'bold', color: '#333' },
  bookNowBtn: { backgroundColor: 'transparent', color: '#2E8B57', border: '1px solid #2E8B57', padding: '0.8rem 1.8rem', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },

  // --- Guides Page ---
  guideListContainer: { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' },
  guideListCard: { display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  guideListImage: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2E8B57' },
  guideListInfo: { flex: 1 },
  guideTagline: { fontStyle: 'italic', color: '#555', margin: '0.5rem 0', fontSize: '0.9rem' },
  guideListMeta: { display: 'flex', gap: '1rem', color: '#555', fontSize: '0.85rem', marginTop: '0.75rem', alignItems: 'center' },
  
  // --- Maps Page ---
  mapsPageContainer: { display: 'flex', gap: '2rem', flexDirection: 'row-reverse', height: '70vh' },
  mapsPageSidebar: { width: '40%', minWidth: '350px', display: 'flex', flexDirection: 'column' },
  mapsPageMapView: { flex: 1 },
  mapsContentContainer: { overflowY: 'auto', flex: 1, paddingRight: '1rem' },
  mapsCard: { display: 'flex', gap: '1rem', marginBottom: '1rem', backgroundColor: '#F8F9FA', padding: '0.75rem', borderRadius: '8px' },
  mapsCardImage: { width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' },
  mapsCardInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  mapsCardTitle: { margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#1A4D2E' },
  mapsCardDescription: { margin: '0 0 auto 0', fontSize: '0.85rem', color: '#666', lineHeight: 1.4 },
  mapCardButtons: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  mapCardButton: { flex: 1, padding: '0.5rem', fontSize: '0.8rem', border: '1px solid #2E8B57', backgroundColor: 'transparent', color: '#2E8B57', borderRadius: '20px', cursor: 'pointer' },

  // --- Local Markets Page ---
  marketListContainer: { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' },
  marketCard: { display: 'flex', gap: '1rem', backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' },
  marketImage: { width: '150px', height: '120px', borderRadius: '8px', objectFit: 'cover' },
  marketInfo: { flex: 1 },
  marketName: { margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1A4D2E' },
  marketLocation: { margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#555' },
  marketDescription: { margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: 1.5 },
  
  // --- Plan Adventure Page ---
  planPageContainer: { maxWidth: '800px', margin: '0 auto', backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '15px' },
  planForm: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  planFormRow: { display: 'flex', gap: '1rem' },
  planFormControl: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1' },
  planStep: { marginBottom: '1.5rem' },
  planStepTitle: { color: '#1A4D2E', borderBottom: '2px solid #D2E3C8', paddingBottom: '0.5rem', marginBottom: '1rem' },
  planInterestGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' },
  planInterestCard: { border: '1px solid #ccc', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease-in-out' },
  planInterestCardSelected: { backgroundColor: '#D2E3C8', color: '#1A4D2E', borderColor: '#2E8B57', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  planInterestIcon: { fontSize: '1.5rem' },
  loader: { border: '4px solid #f3f3f3', borderRadius: '50%', borderTop: '4px solid #2E8B57', width: '20px', height: '20px', animation: 'spin 1s linear infinite', margin: '0 auto' },
  itineraryError: { textAlign: 'center', color: '#dc3545', backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem' },

  // --- Itinerary Display ---
  itineraryResultContainer: { marginTop: '2.5rem', padding: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '10px', border: '1px solid #eee' },
  itineraryTitle: { textAlign: 'center', color: '#1A4D2E', marginBottom: '1.5rem' },
  itineraryTimeline: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  itineraryDay: { paddingLeft: '2.5rem', position: 'relative', borderLeft: '2px solid #D2E3C8' },
  itineraryDayHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  itineraryDayNumber: { position: 'absolute', left: '-18px', top: '0', backgroundColor: '#2E8B57', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' },
  itineraryDayTitle: { margin: 0, color: '#1A4D2E', fontSize: '1.2rem' },
  itineraryDayContent: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  itineraryActivity: { display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  itineraryActivityIconWrapper: { backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itineraryActivityIcon: { color: '#2E8B57', fontSize: '1rem' },
  itineraryActivityDetails: {},
  itineraryActivityTime: { margin: 0, fontWeight: 'bold', color: '#555' },
  itineraryActivityDesc: { margin: '0.25rem 0 0 0', color: '#666', lineHeight: 1.5 },

  // --- SOS Modal ---
  sosModalContainer: { padding: '1rem', overflowY: 'auto', flex: 1 },
  sosModalTabs: { display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', borderBottom: '1px solid #ddd' },
  sosModalTab: { padding: '0.75rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', color: '#555', flex: 1, borderBottom: '3px solid transparent' },
  sosModalTabActive: { color: '#2E8B57', borderBottom: '3px solid #2E8B57' },
  sosModalContent: {},
  sosSection: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' },
  sosSectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' },
  sosDialButton: { padding: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', textDecoration: 'none' },
  sosFindButton: { padding: '0.75rem', fontSize: '1rem', backgroundColor: '#6c757d', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' },
  sosContactList: { listStyle: 'none', padding: 0, margin: '0', textAlign: 'left', fontSize: '0.9rem' },
  sosContactItem: { padding: '0.5rem', borderBottom: '1px solid #eee' },
  sosContactLink: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold' },
  
  // --- Auth Modal & Booking Form ---
  authForm: { padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  authFormControl: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  authInput: { padding: '0.75rem', borderRadius: '5px', border: '1px solid #ccc' },
  authSwitchText: { textAlign: 'center', fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' },
  authSwitchButton: { background: 'none', border: 'none', color: '#2E8B57', fontWeight: 'bold', cursor: 'pointer', marginLeft: '0.25rem', fontSize: '0.9rem' },
  
  // --- User Profile Page / Dashboard ---
  profilePageContainer: { maxWidth: '900px', margin: '0 auto' },
  profileDetailsCard: { backgroundColor: '#F8F9FA', borderRadius: '15px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' },
  dashboardStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  statCard: { backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  statCardIcon: { fontSize: '1.8rem', color: '#2E8B57', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D2E3C8' },
  statCardContent: {},
  statCardTitle: { margin: 0, fontSize: '0.9rem', color: '#555', fontWeight: 'bold' },
  statCardValue: { margin: '0.25rem 0 0 0', fontSize: '1.5rem', color: '#1A4D2E', fontWeight: 'bold' },
  profileBookingsSection: {},
  profileSectionTitle: { fontSize: '1.8rem', color: '#1A4D2E', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '2px solid #eee' },
  bookingsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' },
  bookingCard: { display: 'flex', alignItems: 'flex-start', gap: '1.5rem', backgroundColor: '#F8F9FA', borderRadius: '10px', padding: '1rem' },
  bookingCardIcon: { fontSize: '1.5rem', color: '#2E8B57', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D2E3C8', flexShrink: 0 },
  bookingCardInfo: { flex: 1 },
  bookingCardType: { fontSize: '0.8rem', color: '#555', fontWeight: 'bold', textTransform: 'uppercase' },
  bookingCardName: { margin: '0.25rem 0 0.75rem 0', fontSize: '1.2rem', color: '#1A4D2E' },
  bookingCardDate: { margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#777', textAlign: 'right' },
  bookingCardDetails: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.9rem', color: '#333', marginBottom: '0.5rem' },
  bookingCardNotes: { fontSize: '0.9rem', color: '#555', backgroundColor: '#fff', borderLeft: '3px solid #ccc', padding: '0.5rem', margin: '0.75rem 0 0 0' },

  // --- Market & Place Detail Modal ---
  marketModalContent: { padding: '2rem', textAlign: 'center', overflowY: 'auto' },
  marketModalImage: { width: '100%', height: '200px', borderRadius: '10px', objectFit: 'cover', marginBottom: '1rem' },
  popularItemsContainer: { textAlign: 'left', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#F8F9FA', borderRadius: '8px' },
  popularItemsTitle: { margin: '0 0 0.75rem 0', color: '#1A4D2E' },
  popularItemsGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  popularItemTag: { backgroundColor: '#D2E3C8', color: '#1A4D2E', padding: '0.25rem 0.75rem', borderRadius: '15px', fontSize: '0.9rem' },
  
  // --- Footer ---
  footer: { backgroundColor: '#1A4D2E', color: '#E0E0E0', padding: '1.5rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  footerCopyright: { fontSize: '0.9rem' },
  footerLinksContainer: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  footerLink: { color: '#E0E0E0', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  footerSocialIcon: { fontSize: '1.2rem' },
};

// Global polyfill
if (!window.SpeechRecognition && window.webkitSpeechRecognition) {
    window.SpeechRecognition = window.webkitSpeechRecognition;
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = keyframes;
document.head.appendChild(styleSheet);