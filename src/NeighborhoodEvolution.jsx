import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Bar, ReferenceLine } from 'recharts';
import { MapPin, TrendingUp, Building, Coffee, Beer, UtensilsCrossed, Hotel, Palette } from 'lucide-react';

// Historical evolution data for popular San Diego neighborhoods (2010-2025)
const neighborhoodData = {
    downtown: {
        name: 'Downtown San Diego',
        zip: '92101',
        subAreas: ['Gaslamp', 'East Village', 'Little Italy', 'Columbia'],
        description: 'Urban entertainment hub with condo-dominant housing',
        color: '#3b82f6',
        data: [
            { year: 2010, price: 340000, restaurants: 180, breweries: 4, coffeeShops: 25, boutiques: 45, artGalleries: 18, hotels: 22, nightclubs: 35, condoUnits: 8500, phase: 'Post-Crash', event: 'Recovery begins' },
            { year: 2011, price: 310000, restaurants: 185, breweries: 5, coffeeShops: 28, boutiques: 48, artGalleries: 20, hotels: 23, nightclubs: 36, condoUnits: 9200, phase: 'Bottom' },
            { year: 2012, price: 295000, restaurants: 190, breweries: 6, coffeeShops: 30, boutiques: 50, artGalleries: 22, hotels: 24, nightclubs: 38, condoUnits: 9800, phase: 'Bottom', event: 'Market bottoms' },
            { year: 2013, price: 340000, restaurants: 200, breweries: 7, coffeeShops: 34, boutiques: 55, artGalleries: 24, hotels: 25, nightclubs: 40, condoUnits: 10500, phase: 'Recovery', event: 'SD Central Library opens' },
            { year: 2014, price: 380000, restaurants: 215, breweries: 9, coffeeShops: 38, boutiques: 60, artGalleries: 26, hotels: 26, nightclubs: 42, condoUnits: 11200, phase: 'Recovery' },
            { year: 2015, price: 420000, restaurants: 230, breweries: 11, coffeeShops: 42, boutiques: 65, artGalleries: 28, hotels: 28, nightclubs: 44, condoUnits: 12000, phase: 'Growth', event: 'Ballast Point sold $1B' },
            { year: 2016, price: 455000, restaurants: 250, breweries: 13, coffeeShops: 48, boutiques: 72, artGalleries: 30, hotels: 30, nightclubs: 46, condoUnits: 13000, phase: 'Growth' },
            { year: 2017, price: 480000, restaurants: 265, breweries: 14, coffeeShops: 52, boutiques: 78, artGalleries: 32, hotels: 32, nightclubs: 48, condoUnits: 14200, phase: 'Growth', event: 'IDEA1 opens (East Village)' },
            { year: 2018, price: 510000, restaurants: 280, breweries: 15, coffeeShops: 56, boutiques: 82, artGalleries: 33, hotels: 34, nightclubs: 48, condoUnits: 15500, phase: 'Expansion' },
            { year: 2019, price: 540000, restaurants: 295, breweries: 16, coffeeShops: 60, boutiques: 88, artGalleries: 34, hotels: 36, nightclubs: 50, condoUnits: 16800, phase: 'Expansion', event: 'Peak pre-pandemic' },
            { year: 2020, price: 520000, restaurants: 250, breweries: 14, coffeeShops: 52, boutiques: 75, artGalleries: 30, hotels: 36, nightclubs: 40, condoUnits: 17200, phase: 'Pandemic', event: 'COVID devastates Gaslamp' },
            { year: 2021, price: 620000, restaurants: 260, breweries: 14, coffeeShops: 55, boutiques: 78, artGalleries: 31, hotels: 36, nightclubs: 42, condoUnits: 17800, phase: 'Recovery' },
            { year: 2022, price: 715000, restaurants: 280, breweries: 15, coffeeShops: 60, boutiques: 85, artGalleries: 33, hotels: 38, nightclubs: 45, condoUnits: 18500, phase: 'Rebound', event: 'UCSD Park & Market' },
            { year: 2023, price: 720000, restaurants: 290, breweries: 15, coffeeShops: 62, boutiques: 88, artGalleries: 34, hotels: 40, nightclubs: 46, condoUnits: 19200, phase: 'Stabilization' },
            { year: 2024, price: 735000, restaurants: 300, breweries: 16, coffeeShops: 65, boutiques: 92, artGalleries: 35, hotels: 42, nightclubs: 48, condoUnits: 20000, phase: 'Stabilization' },
            { year: 2025, price: 740000, restaurants: 310, breweries: 16, coffeeShops: 68, boutiques: 95, artGalleries: 36, hotels: 44, nightclubs: 50, condoUnits: 21000, phase: 'Current', event: 'East Village Quarter approved' },
        ]
    },
    northPark: {
        name: 'North Park',
        zip: '92104',
        subAreas: [],
        description: 'Classic gentrification: breweries, boutiques, and walkability',
        color: '#22c55e',
        data: [
            { year: 2010, price: 385000, restaurants: 55, breweries: 2, coffeeShops: 12, boutiques: 35, artGalleries: 8, hotels: 2, nightclubs: 8, condoUnits: 1200, phase: 'Pre-Boom', event: 'Arts district emerging' },
            { year: 2011, price: 365000, restaurants: 58, breweries: 2, coffeeShops: 14, boutiques: 38, artGalleries: 9, hotels: 2, nightclubs: 9, condoUnits: 1300, phase: 'Bottom' },
            { year: 2012, price: 350000, restaurants: 62, breweries: 3, coffeeShops: 16, boutiques: 42, artGalleries: 10, hotels: 2, nightclubs: 10, condoUnits: 1400, phase: 'Bottom', event: 'Market bottoms' },
            { year: 2013, price: 420000, restaurants: 70, breweries: 4, coffeeShops: 20, boutiques: 48, artGalleries: 12, hotels: 3, nightclubs: 12, condoUnits: 1500, phase: 'Recovery', event: 'Craft beer wave begins' },
            { year: 2014, price: 485000, restaurants: 82, breweries: 6, coffeeShops: 25, boutiques: 55, artGalleries: 14, hotels: 3, nightclubs: 14, condoUnits: 1650, phase: 'Growth' },
            { year: 2015, price: 545000, restaurants: 95, breweries: 8, coffeeShops: 30, boutiques: 62, artGalleries: 16, hotels: 3, nightclubs: 16, condoUnits: 1800, phase: 'Growth', event: 'Observatory opens' },
            { year: 2016, price: 620000, restaurants: 108, breweries: 10, coffeeShops: 35, boutiques: 70, artGalleries: 18, hotels: 4, nightclubs: 18, condoUnits: 2000, phase: 'Boom', event: 'Gentrification accelerates' },
            { year: 2017, price: 695000, restaurants: 120, breweries: 12, coffeeShops: 40, boutiques: 78, artGalleries: 20, hotels: 4, nightclubs: 20, condoUnits: 2200, phase: 'Boom' },
            { year: 2018, price: 755000, restaurants: 132, breweries: 13, coffeeShops: 45, boutiques: 85, artGalleries: 22, hotels: 4, nightclubs: 22, condoUnits: 2400, phase: 'Peak' },
            { year: 2019, price: 810000, restaurants: 142, breweries: 14, coffeeShops: 50, boutiques: 92, artGalleries: 24, hotels: 5, nightclubs: 24, condoUnits: 2600, phase: 'Peak', event: 'Highest density of bars' },
            { year: 2020, price: 820000, restaurants: 125, breweries: 12, coffeeShops: 45, boutiques: 82, artGalleries: 22, hotels: 5, nightclubs: 20, condoUnits: 2700, phase: 'Pandemic' },
            { year: 2021, price: 920000, restaurants: 135, breweries: 13, coffeeShops: 48, boutiques: 88, artGalleries: 23, hotels: 5, nightclubs: 22, condoUnits: 2850, phase: 'Recovery' },
            { year: 2022, price: 1050000, restaurants: 145, breweries: 14, coffeeShops: 52, boutiques: 95, artGalleries: 25, hotels: 5, nightclubs: 24, condoUnits: 3000, phase: 'Surge', event: 'Median crosses $1M' },
            { year: 2023, price: 1085000, restaurants: 152, breweries: 14, coffeeShops: 55, boutiques: 100, artGalleries: 26, hotels: 6, nightclubs: 25, condoUnits: 3150, phase: 'Stabilization' },
            { year: 2024, price: 1120000, restaurants: 158, breweries: 15, coffeeShops: 58, boutiques: 105, artGalleries: 27, hotels: 6, nightclubs: 26, condoUnits: 3300, phase: 'Stabilization' },
            { year: 2025, price: 1150000, restaurants: 165, breweries: 15, coffeeShops: 60, boutiques: 110, artGalleries: 28, hotels: 6, nightclubs: 27, condoUnits: 3450, phase: 'Current', event: 'Mature urban village' },
        ]
    },
    hillcrest: {
        name: 'Hillcrest',
        zip: '92103',
        subAreas: ['Mission Hills'],
        description: 'LGBTQ+ cultural hub with eclectic dining and nightlife',
        color: '#a855f7',
        data: [
            { year: 2010, price: 420000, restaurants: 85, breweries: 2, coffeeShops: 18, boutiques: 55, artGalleries: 10, hotels: 4, nightclubs: 15, condoUnits: 2800, phase: 'Established', event: 'Pride parade tradition' },
            { year: 2011, price: 395000, restaurants: 88, breweries: 2, coffeeShops: 20, boutiques: 58, artGalleries: 11, hotels: 4, nightclubs: 15, condoUnits: 2900, phase: 'Bottom' },
            { year: 2012, price: 380000, restaurants: 90, breweries: 3, coffeeShops: 22, boutiques: 60, artGalleries: 12, hotels: 4, nightclubs: 16, condoUnits: 3000, phase: 'Bottom' },
            { year: 2013, price: 435000, restaurants: 95, breweries: 4, coffeeShops: 25, boutiques: 65, artGalleries: 13, hotels: 5, nightclubs: 17, condoUnits: 3150, phase: 'Recovery' },
            { year: 2014, price: 490000, restaurants: 102, breweries: 5, coffeeShops: 28, boutiques: 70, artGalleries: 14, hotels: 5, nightclubs: 18, condoUnits: 3300, phase: 'Growth' },
            { year: 2015, price: 545000, restaurants: 110, breweries: 6, coffeeShops: 32, boutiques: 75, artGalleries: 15, hotels: 5, nightclubs: 18, condoUnits: 3450, phase: 'Growth' },
            { year: 2016, price: 610000, restaurants: 118, breweries: 7, coffeeShops: 36, boutiques: 80, artGalleries: 16, hotels: 6, nightclubs: 19, condoUnits: 3600, phase: 'Growth', event: 'Restaurant row expansion' },
            { year: 2017, price: 670000, restaurants: 125, breweries: 8, coffeeShops: 40, boutiques: 85, artGalleries: 17, hotels: 6, nightclubs: 19, condoUnits: 3750, phase: 'Growth' },
            { year: 2018, price: 720000, restaurants: 132, breweries: 9, coffeeShops: 44, boutiques: 90, artGalleries: 18, hotels: 6, nightclubs: 20, condoUnits: 3900, phase: 'Expansion' },
            { year: 2019, price: 785000, restaurants: 140, breweries: 10, coffeeShops: 48, boutiques: 95, artGalleries: 19, hotels: 7, nightclubs: 20, condoUnits: 4050, phase: 'Expansion' },
            { year: 2020, price: 775000, restaurants: 120, breweries: 9, coffeeShops: 42, boutiques: 85, artGalleries: 17, hotels: 7, nightclubs: 16, condoUnits: 4150, phase: 'Pandemic', event: 'Nightlife hit hard' },
            { year: 2021, price: 880000, restaurants: 128, breweries: 9, coffeeShops: 45, boutiques: 88, artGalleries: 18, hotels: 7, nightclubs: 17, condoUnits: 4250, phase: 'Recovery' },
            { year: 2022, price: 985000, restaurants: 138, breweries: 10, coffeeShops: 50, boutiques: 92, artGalleries: 19, hotels: 7, nightclubs: 19, condoUnits: 4400, phase: 'Rebound' },
            { year: 2023, price: 1020000, restaurants: 145, breweries: 10, coffeeShops: 52, boutiques: 96, artGalleries: 20, hotels: 8, nightclubs: 20, condoUnits: 4550, phase: 'Stabilization' },
            { year: 2024, price: 1065000, restaurants: 150, breweries: 11, coffeeShops: 55, boutiques: 100, artGalleries: 21, hotels: 8, nightclubs: 21, condoUnits: 4700, phase: 'Stabilization' },
            { year: 2025, price: 1100000, restaurants: 155, breweries: 11, coffeeShops: 58, boutiques: 105, artGalleries: 22, hotels: 8, nightclubs: 22, condoUnits: 4850, phase: 'Current' },
        ]
    },
    laJolla: {
        name: 'La Jolla',
        zip: '92037',
        subAreas: ['Village', 'Shores', 'Bird Rock'],
        description: 'Luxury coastal market with high-end retail and dining',
        color: '#0ea5e9',
        data: [
            { year: 2010, price: 1450000, restaurants: 95, breweries: 1, coffeeShops: 22, boutiques: 85, artGalleries: 25, hotels: 12, nightclubs: 5, condoUnits: 3200, phase: 'Luxury', event: 'Coastal premium holds' },
            { year: 2011, price: 1380000, restaurants: 98, breweries: 1, coffeeShops: 24, boutiques: 88, artGalleries: 26, hotels: 12, nightclubs: 5, condoUnits: 3300, phase: 'Dip' },
            { year: 2012, price: 1350000, restaurants: 100, breweries: 1, coffeeShops: 25, boutiques: 90, artGalleries: 27, hotels: 12, nightclubs: 5, condoUnits: 3400, phase: 'Bottom' },
            { year: 2013, price: 1520000, restaurants: 105, breweries: 2, coffeeShops: 28, boutiques: 95, artGalleries: 28, hotels: 13, nightclubs: 5, condoUnits: 3500, phase: 'Recovery' },
            { year: 2014, price: 1720000, restaurants: 110, breweries: 2, coffeeShops: 30, boutiques: 100, artGalleries: 30, hotels: 13, nightclubs: 6, condoUnits: 3600, phase: 'Growth' },
            { year: 2015, price: 1920000, restaurants: 115, breweries: 3, coffeeShops: 32, boutiques: 105, artGalleries: 32, hotels: 14, nightclubs: 6, condoUnits: 3700, phase: 'Growth', event: 'Tech wealth influx' },
            { year: 2016, price: 2150000, restaurants: 120, breweries: 3, coffeeShops: 35, boutiques: 110, artGalleries: 34, hotels: 14, nightclubs: 6, condoUnits: 3800, phase: 'Boom' },
            { year: 2017, price: 2380000, restaurants: 125, breweries: 4, coffeeShops: 38, boutiques: 115, artGalleries: 36, hotels: 15, nightclubs: 7, condoUnits: 3900, phase: 'Boom' },
            { year: 2018, price: 2580000, restaurants: 130, breweries: 4, coffeeShops: 40, boutiques: 120, artGalleries: 38, hotels: 15, nightclubs: 7, condoUnits: 4000, phase: 'Peak' },
            { year: 2019, price: 2750000, restaurants: 135, breweries: 5, coffeeShops: 42, boutiques: 125, artGalleries: 40, hotels: 16, nightclubs: 7, condoUnits: 4100, phase: 'Peak' },
            { year: 2020, price: 2680000, restaurants: 118, breweries: 4, coffeeShops: 38, boutiques: 115, artGalleries: 36, hotels: 16, nightclubs: 5, condoUnits: 4150, phase: 'Pandemic' },
            { year: 2021, price: 3150000, restaurants: 125, breweries: 5, coffeeShops: 40, boutiques: 120, artGalleries: 38, hotels: 16, nightclubs: 6, condoUnits: 4200, phase: 'Surge', event: 'Remote work premium' },
            { year: 2022, price: 3650000, restaurants: 132, breweries: 5, coffeeShops: 44, boutiques: 128, artGalleries: 40, hotels: 17, nightclubs: 7, condoUnits: 4300, phase: 'Peak' },
            { year: 2023, price: 3720000, restaurants: 138, breweries: 5, coffeeShops: 46, boutiques: 132, artGalleries: 42, hotels: 17, nightclubs: 7, condoUnits: 4400, phase: 'Stabilization' },
            { year: 2024, price: 3800000, restaurants: 142, breweries: 6, coffeeShops: 48, boutiques: 135, artGalleries: 44, hotels: 18, nightclubs: 8, condoUnits: 4500, phase: 'Stabilization' },
            { year: 2025, price: 3850000, restaurants: 145, breweries: 6, coffeeShops: 50, boutiques: 138, artGalleries: 45, hotels: 18, nightclubs: 8, condoUnits: 4600, phase: 'Current', event: 'Luxury market stable' },
        ]
    },
    pacificBeach: {
        name: 'Pacific Beach',
        zip: '92109',
        subAreas: ['Mission Beach'],
        description: 'Beach lifestyle with strong rental market and nightlife',
        color: '#f59e0b',
        data: [
            { year: 2010, price: 620000, restaurants: 75, breweries: 3, coffeeShops: 15, boutiques: 40, artGalleries: 5, hotels: 8, nightclubs: 25, condoUnits: 4500, phase: 'Beach', event: 'Party reputation' },
            { year: 2011, price: 585000, restaurants: 78, breweries: 3, coffeeShops: 16, boutiques: 42, artGalleries: 5, hotels: 8, nightclubs: 26, condoUnits: 4600, phase: 'Bottom' },
            { year: 2012, price: 560000, restaurants: 80, breweries: 4, coffeeShops: 18, boutiques: 45, artGalleries: 6, hotels: 8, nightclubs: 28, condoUnits: 4700, phase: 'Bottom' },
            { year: 2013, price: 640000, restaurants: 85, breweries: 5, coffeeShops: 20, boutiques: 48, artGalleries: 7, hotels: 9, nightclubs: 30, condoUnits: 4850, phase: 'Recovery' },
            { year: 2014, price: 720000, restaurants: 92, breweries: 6, coffeeShops: 24, boutiques: 52, artGalleries: 8, hotels: 9, nightclubs: 32, condoUnits: 5000, phase: 'Growth' },
            { year: 2015, price: 810000, restaurants: 100, breweries: 7, coffeeShops: 28, boutiques: 58, artGalleries: 9, hotels: 10, nightclubs: 34, condoUnits: 5150, phase: 'Growth' },
            { year: 2016, price: 920000, restaurants: 108, breweries: 8, coffeeShops: 32, boutiques: 62, artGalleries: 10, hotels: 10, nightclubs: 36, condoUnits: 5300, phase: 'Growth' },
            { year: 2017, price: 1020000, restaurants: 115, breweries: 9, coffeeShops: 36, boutiques: 68, artGalleries: 11, hotels: 11, nightclubs: 38, condoUnits: 5450, phase: 'Boom', event: 'Garnet Ave renovation' },
            { year: 2018, price: 1120000, restaurants: 122, breweries: 10, coffeeShops: 40, boutiques: 72, artGalleries: 12, hotels: 11, nightclubs: 38, condoUnits: 5600, phase: 'Boom' },
            { year: 2019, price: 1210000, restaurants: 128, breweries: 11, coffeeShops: 44, boutiques: 78, artGalleries: 13, hotels: 12, nightclubs: 40, condoUnits: 5750, phase: 'Peak' },
            { year: 2020, price: 1180000, restaurants: 108, breweries: 9, coffeeShops: 38, boutiques: 68, artGalleries: 11, hotels: 12, nightclubs: 32, condoUnits: 5850, phase: 'Pandemic', event: 'Tourism crash' },
            { year: 2021, price: 1380000, restaurants: 115, breweries: 10, coffeeShops: 42, boutiques: 72, artGalleries: 12, hotels: 12, nightclubs: 35, condoUnits: 5950, phase: 'Recovery' },
            { year: 2022, price: 1580000, restaurants: 125, breweries: 11, coffeeShops: 48, boutiques: 80, artGalleries: 14, hotels: 13, nightclubs: 38, condoUnits: 6100, phase: 'Surge' },
            { year: 2023, price: 1620000, restaurants: 132, breweries: 11, coffeeShops: 52, boutiques: 85, artGalleries: 15, hotels: 13, nightclubs: 40, condoUnits: 6250, phase: 'Stabilization' },
            { year: 2024, price: 1680000, restaurants: 138, breweries: 12, coffeeShops: 55, boutiques: 88, artGalleries: 16, hotels: 14, nightclubs: 42, condoUnits: 6400, phase: 'Stabilization' },
            { year: 2025, price: 1720000, restaurants: 142, breweries: 12, coffeeShops: 58, boutiques: 92, artGalleries: 17, hotels: 14, nightclubs: 44, condoUnits: 6550, phase: 'Current' },
        ]
    },
    normalHeights: {
        name: 'Normal Heights',
        zip: '92116',
        subAreas: ['Kensington'],
        description: 'Emerging arts district with neighborhood character',
        color: '#ec4899',
        data: [
            { year: 2010, price: 340000, restaurants: 22, breweries: 1, coffeeShops: 5, boutiques: 15, artGalleries: 4, hotels: 1, nightclubs: 6, condoUnits: 650, phase: 'Hidden Gem', event: 'Artists moving in' },
            { year: 2011, price: 315000, restaurants: 24, breweries: 1, coffeeShops: 6, boutiques: 16, artGalleries: 5, hotels: 1, nightclubs: 6, condoUnits: 680, phase: 'Bottom' },
            { year: 2012, price: 295000, restaurants: 26, breweries: 1, coffeeShops: 7, boutiques: 18, artGalleries: 5, hotels: 1, nightclubs: 7, condoUnits: 710, phase: 'Bottom' },
            { year: 2013, price: 360000, restaurants: 30, breweries: 2, coffeeShops: 9, boutiques: 20, artGalleries: 6, hotels: 1, nightclubs: 8, condoUnits: 750, phase: 'Discovery' },
            { year: 2014, price: 425000, restaurants: 35, breweries: 2, coffeeShops: 11, boutiques: 24, artGalleries: 7, hotels: 1, nightclubs: 9, condoUnits: 800, phase: 'Growth', event: 'First craft brewery' },
            { year: 2015, price: 495000, restaurants: 42, breweries: 3, coffeeShops: 14, boutiques: 28, artGalleries: 8, hotels: 2, nightclubs: 10, condoUnits: 850, phase: 'Growth' },
            { year: 2016, price: 575000, restaurants: 50, breweries: 4, coffeeShops: 17, boutiques: 32, artGalleries: 10, hotels: 2, nightclubs: 11, condoUnits: 920, phase: 'Transition', event: 'Adams Ave festival grows' },
            { year: 2017, price: 650000, restaurants: 58, breweries: 5, coffeeShops: 20, boutiques: 38, artGalleries: 12, hotels: 2, nightclubs: 12, condoUnits: 1000, phase: 'Transition' },
            { year: 2018, price: 725000, restaurants: 65, breweries: 6, coffeeShops: 24, boutiques: 42, artGalleries: 14, hotels: 2, nightclubs: 13, condoUnits: 1080, phase: 'Gentrifying' },
            { year: 2019, price: 795000, restaurants: 72, breweries: 7, coffeeShops: 28, boutiques: 48, artGalleries: 16, hotels: 3, nightclubs: 14, condoUnits: 1160, phase: 'Gentrifying' },
            { year: 2020, price: 810000, restaurants: 62, breweries: 6, coffeeShops: 24, boutiques: 42, artGalleries: 14, hotels: 3, nightclubs: 11, condoUnits: 1200, phase: 'Pandemic' },
            { year: 2021, price: 920000, restaurants: 68, breweries: 7, coffeeShops: 27, boutiques: 46, artGalleries: 15, hotels: 3, nightclubs: 12, condoUnits: 1250, phase: 'Recovery' },
            { year: 2022, price: 1050000, restaurants: 75, breweries: 8, coffeeShops: 32, boutiques: 52, artGalleries: 17, hotels: 3, nightclubs: 14, condoUnits: 1320, phase: 'Surge', event: 'Median crosses $1M' },
            { year: 2023, price: 1085000, restaurants: 82, breweries: 8, coffeeShops: 35, boutiques: 56, artGalleries: 18, hotels: 4, nightclubs: 15, condoUnits: 1400, phase: 'Stabilization' },
            { year: 2024, price: 1120000, restaurants: 88, breweries: 9, coffeeShops: 38, boutiques: 60, artGalleries: 20, hotels: 4, nightclubs: 16, condoUnits: 1480, phase: 'Stabilization' },
            { year: 2025, price: 1150000, restaurants: 92, breweries: 9, coffeeShops: 40, boutiques: 64, artGalleries: 21, hotels: 4, nightclubs: 17, condoUnits: 1560, phase: 'Current', event: 'Arts district official' },
        ]
    },
    delMar: {
        name: 'Del Mar',
        zip: '92014',
        subAreas: [],
        description: 'Upscale coastal village with horse racing culture',
        color: '#14b8a6',
        data: [
            { year: 2010, price: 1280000, restaurants: 45, breweries: 1, coffeeShops: 10, boutiques: 55, artGalleries: 12, hotels: 5, nightclubs: 3, condoUnits: 1200, phase: 'Coastal', event: 'Del Mar Fairgrounds' },
            { year: 2011, price: 1220000, restaurants: 46, breweries: 1, coffeeShops: 11, boutiques: 56, artGalleries: 12, hotels: 5, nightclubs: 3, condoUnits: 1220, phase: 'Dip' },
            { year: 2012, price: 1180000, restaurants: 48, breweries: 1, coffeeShops: 12, boutiques: 58, artGalleries: 13, hotels: 5, nightclubs: 3, condoUnits: 1240, phase: 'Bottom' },
            { year: 2013, price: 1380000, restaurants: 50, breweries: 2, coffeeShops: 14, boutiques: 60, artGalleries: 14, hotels: 6, nightclubs: 4, condoUnits: 1280, phase: 'Recovery' },
            { year: 2014, price: 1580000, restaurants: 54, breweries: 2, coffeeShops: 16, boutiques: 65, artGalleries: 15, hotels: 6, nightclubs: 4, condoUnits: 1320, phase: 'Growth' },
            { year: 2015, price: 1780000, restaurants: 58, breweries: 2, coffeeShops: 18, boutiques: 70, artGalleries: 16, hotels: 6, nightclubs: 4, condoUnits: 1360, phase: 'Growth' },
            { year: 2016, price: 2020000, restaurants: 62, breweries: 3, coffeeShops: 20, boutiques: 75, artGalleries: 18, hotels: 7, nightclubs: 5, condoUnits: 1400, phase: 'Boom' },
            { year: 2017, price: 2280000, restaurants: 66, breweries: 3, coffeeShops: 22, boutiques: 80, artGalleries: 20, hotels: 7, nightclubs: 5, condoUnits: 1450, phase: 'Boom' },
            { year: 2018, price: 2520000, restaurants: 70, breweries: 4, coffeeShops: 24, boutiques: 85, artGalleries: 22, hotels: 7, nightclubs: 5, condoUnits: 1500, phase: 'Peak' },
            { year: 2019, price: 2720000, restaurants: 74, breweries: 4, coffeeShops: 26, boutiques: 88, artGalleries: 24, hotels: 8, nightclubs: 6, condoUnits: 1550, phase: 'Peak' },
            { year: 2020, price: 2650000, restaurants: 62, breweries: 3, coffeeShops: 22, boutiques: 78, artGalleries: 20, hotels: 8, nightclubs: 4, condoUnits: 1580, phase: 'Pandemic' },
            { year: 2021, price: 3150000, restaurants: 68, breweries: 4, coffeeShops: 25, boutiques: 82, artGalleries: 22, hotels: 8, nightclubs: 5, condoUnits: 1620, phase: 'Surge', event: 'WFH migration' },
            { year: 2022, price: 3580000, restaurants: 74, breweries: 4, coffeeShops: 28, boutiques: 90, artGalleries: 25, hotels: 9, nightclubs: 6, condoUnits: 1680, phase: 'Peak' },
            { year: 2023, price: 3650000, restaurants: 78, breweries: 4, coffeeShops: 30, boutiques: 94, artGalleries: 27, hotels: 9, nightclubs: 6, condoUnits: 1740, phase: 'Stabilization' },
            { year: 2024, price: 3720000, restaurants: 82, breweries: 5, coffeeShops: 32, boutiques: 98, artGalleries: 28, hotels: 10, nightclubs: 7, condoUnits: 1800, phase: 'Stabilization' },
            { year: 2025, price: 3780000, restaurants: 85, breweries: 5, coffeeShops: 34, boutiques: 102, artGalleries: 30, hotels: 10, nightclubs: 7, condoUnits: 1860, phase: 'Current' },
        ]
    },
    oceanBeach: {
        name: 'Ocean Beach',
        zip: '92107',
        subAreas: [],
        description: 'Bohemian beach community resisting chain retail',
        color: '#ef4444',
        data: [
            { year: 2010, price: 485000, restaurants: 55, breweries: 2, coffeeShops: 12, boutiques: 45, artGalleries: 8, hotels: 4, nightclubs: 12, condoUnits: 1800, phase: 'Bohemian', event: 'Anti-chain culture' },
            { year: 2011, price: 455000, restaurants: 56, breweries: 2, coffeeShops: 13, boutiques: 46, artGalleries: 8, hotels: 4, nightclubs: 12, condoUnits: 1850, phase: 'Bottom' },
            { year: 2012, price: 435000, restaurants: 58, breweries: 2, coffeeShops: 14, boutiques: 48, artGalleries: 9, hotels: 4, nightclubs: 13, condoUnits: 1900, phase: 'Bottom' },
            { year: 2013, price: 510000, restaurants: 62, breweries: 3, coffeeShops: 16, boutiques: 52, artGalleries: 10, hotels: 4, nightclubs: 14, condoUnits: 1950, phase: 'Recovery' },
            { year: 2014, price: 595000, restaurants: 68, breweries: 4, coffeeShops: 18, boutiques: 56, artGalleries: 11, hotels: 5, nightclubs: 15, condoUnits: 2020, phase: 'Growth' },
            { year: 2015, price: 695000, restaurants: 75, breweries: 5, coffeeShops: 22, boutiques: 62, artGalleries: 12, hotels: 5, nightclubs: 16, condoUnits: 2100, phase: 'Growth' },
            { year: 2016, price: 815000, restaurants: 82, breweries: 6, coffeeShops: 26, boutiques: 68, artGalleries: 14, hotels: 5, nightclubs: 17, condoUnits: 2180, phase: 'Growth', event: 'Pizza Port opens' },
            { year: 2017, price: 925000, restaurants: 88, breweries: 7, coffeeShops: 30, boutiques: 74, artGalleries: 16, hotels: 6, nightclubs: 18, condoUnits: 2260, phase: 'Boom' },
            { year: 2018, price: 1020000, restaurants: 94, breweries: 8, coffeeShops: 34, boutiques: 78, artGalleries: 18, hotels: 6, nightclubs: 19, condoUnits: 2340, phase: 'Boom', event: 'Median hits $1M' },
            { year: 2019, price: 1095000, restaurants: 100, breweries: 9, coffeeShops: 38, boutiques: 84, artGalleries: 20, hotels: 6, nightclubs: 20, condoUnits: 2420, phase: 'Peak' },
            { year: 2020, price: 1080000, restaurants: 85, breweries: 7, coffeeShops: 32, boutiques: 72, artGalleries: 17, hotels: 6, nightclubs: 15, condoUnits: 2480, phase: 'Pandemic' },
            { year: 2021, price: 1260000, restaurants: 92, breweries: 8, coffeeShops: 36, boutiques: 78, artGalleries: 19, hotels: 6, nightclubs: 17, condoUnits: 2540, phase: 'Recovery' },
            { year: 2022, price: 1450000, restaurants: 98, breweries: 9, coffeeShops: 42, boutiques: 86, artGalleries: 22, hotels: 7, nightclubs: 19, condoUnits: 2620, phase: 'Surge' },
            { year: 2023, price: 1520000, restaurants: 104, breweries: 9, coffeeShops: 46, boutiques: 92, artGalleries: 24, hotels: 7, nightclubs: 20, condoUnits: 2700, phase: 'Stabilization' },
            { year: 2024, price: 1580000, restaurants: 110, breweries: 10, coffeeShops: 50, boutiques: 96, artGalleries: 26, hotels: 8, nightclubs: 21, condoUnits: 2780, phase: 'Stabilization' },
            { year: 2025, price: 1620000, restaurants: 115, breweries: 10, coffeeShops: 52, boutiques: 100, artGalleries: 28, hotels: 8, nightclubs: 22, condoUnits: 2860, phase: 'Current', event: 'Character preserved' },
        ]
    }
};

const phaseColors = {
    'Post-Crash': '#f59e0b', 'Bottom': '#ef4444', 'Recovery': '#84cc16', 'Growth': '#22c55e',
    'Expansion': '#16a34a', 'Pandemic': '#a855f7', 'Rebound': '#3b82f6', 'Stabilization': '#06b6d4',
    'Current': '#14b8a6', 'Pre-Boom': '#fbbf24', 'Boom': '#10b981', 'Peak': '#6366f1',
    'Surge': '#8b5cf6', 'Established': '#f472b6', 'Luxury': '#0ea5e9', 'Dip': '#fb923c',
    'Beach': '#facc15', 'Hidden Gem': '#d946ef', 'Discovery': '#a3e635', 'Transition': '#22d3ee',
    'Gentrifying': '#f43f5e', 'Coastal': '#0891b2', 'Bohemian': '#e11d48'
};

const CustomTooltip = ({ active, payload, label, neighborhoodKey }) => {
    if (active && payload && payload.length) {
        const data = neighborhoodData[neighborhoodKey]?.data.find(d => d.year === label);
        return (
            <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700 max-w-xs">
                <p className="text-white font-bold text-lg mb-2">{label}</p>
                <p className="text-gray-400 text-sm mb-2">Phase: <span className="text-white">{data?.phase}</span></p>
                {data?.event && <p className="text-yellow-400 text-sm mb-2 italic">📍 {data.event}</p>}
                <div className="border-t border-gray-700 pt-2 mt-2">
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.name.includes('Price') ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const formatPrice = (value) => `$${(value / 1000000).toFixed(1)}M`;

function MetricCard({ label, value, change, sublabel, icon: Icon, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-900/30 border-blue-800/50 text-blue-400',
        green: 'bg-green-900/30 border-green-800/50 text-green-400',
        purple: 'bg-purple-900/30 border-purple-800/50 text-purple-400',
        yellow: 'bg-yellow-900/30 border-yellow-800/50 text-yellow-400',
        pink: 'bg-pink-900/30 border-pink-800/50 text-pink-400',
        cyan: 'bg-cyan-900/30 border-cyan-800/50 text-cyan-400',
    };
    return (
        <div className={`rounded-xl p-4 border ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {change && <p className="text-sm text-green-400">{change}</p>}
            {sublabel && <p className="text-xs opacity-60 mt-1">{sublabel}</p>}
        </div>
    );
}

export default function NeighborhoodEvolution() {
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('downtown');
    const [activeView, setActiveView] = useState('combined');

    const neighborhood = neighborhoodData[selectedNeighborhood];
    const data = neighborhood.data;

    const metrics = useMemo(() => {
        const first = data[0];
        const last = data[data.length - 1];
        const priceChange = ((last.price - first.price) / first.price * 100).toFixed(0);
        const restaurantChange = ((last.restaurants - first.restaurants) / first.restaurants * 100).toFixed(0);
        const condoChange = ((last.condoUnits - first.condoUnits) / first.condoUnits * 100).toFixed(0);
        const breweryChange = last.breweries - first.breweries;
        return { first, last, priceChange, restaurantChange, condoChange, breweryChange };
    }, [data]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-800/50">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold">Neighborhood Evolution</h1>
                    </div>
                    <p className="text-sm text-gray-400">15 Years of Urban Development: 2010-2025</p>
                </div>

                {/* Neighborhood Selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {Object.entries(neighborhoodData).map(([key, n]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedNeighborhood(key)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedNeighborhood === key
                                    ? 'text-white shadow-lg'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            style={selectedNeighborhood === key ? { backgroundColor: n.color } : {}}
                        >
                            <span>{n.name}</span>
                            <span className="text-xs opacity-70">{n.zip}</span>
                        </button>
                    ))}
                </div>

                {/* Sub-areas */}
                {neighborhood.subAreas.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                        <span>Includes:</span>
                        {neighborhood.subAreas.map((area, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-800 rounded">{area}</span>
                        ))}
                    </div>
                )}

                {/* Description */}
                <p className="text-gray-400 text-sm mb-6">{neighborhood.description}</p>

                {/* View Toggles */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => setActiveView('combined')}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${activeView === 'combined' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        Price vs Retail
                    </button>
                    <button onClick={() => setActiveView('hospitality')}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${activeView === 'hospitality' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        Hospitality
                    </button>
                    <button onClick={() => setActiveView('development')}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${activeView === 'development' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        Development
                    </button>
                    <button onClick={() => setActiveView('retail')}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${activeView === 'retail' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        Retail Stack
                    </button>
                </div>

                {/* Chart */}
                <div className="bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-800">
                    <h2 className="text-lg font-semibold mb-4 text-center">
                        {activeView === 'combined' && 'Housing Price vs Restaurant Count'}
                        {activeView === 'hospitality' && 'Hospitality & Entertainment Growth'}
                        {activeView === 'development' && 'Condo Unit Growth vs Price'}
                        {activeView === 'retail' && 'Retail Composition Over Time'}
                    </h2>
                    <ResponsiveContainer width="100%" height={400}>
                        {activeView === 'combined' && (
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="year" stroke="#9ca3af" />
                                <YAxis yAxisId="left" stroke="#3b82f6" tickFormatter={formatPrice} />
                                <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                                <Tooltip content={<CustomTooltip neighborhoodKey={selectedNeighborhood} />} />
                                <Legend />
                                <ReferenceLine yAxisId="left" x={2012} stroke="#ef4444" strokeDasharray="5 5" />
                                <ReferenceLine yAxisId="left" x={2020} stroke="#a855f7" strokeDasharray="5 5" />
                                <Area yAxisId="left" type="monotone" dataKey="price" name="Median Price" fill={neighborhood.color} fillOpacity={0.3} stroke={neighborhood.color} strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="restaurants" name="Restaurants" stroke="#22c55e" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="nightclubs" name="Nightlife" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        )}
                        {activeView === 'hospitality' && (
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="year" stroke="#9ca3af" />
                                <YAxis yAxisId="left" stroke="#3b82f6" tickFormatter={formatPrice} />
                                <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                                <Tooltip content={<CustomTooltip neighborhoodKey={selectedNeighborhood} />} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="price" name="Median Price" fill={neighborhood.color} fillOpacity={0.2} stroke={neighborhood.color} strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="restaurants" name="Restaurants" stroke="#22c55e" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="hotels" name="Hotels" stroke="#8b5cf6" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="breweries" name="Breweries" stroke="#ef4444" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="coffeeShops" name="Coffee Shops" stroke="#f59e0b" strokeWidth={2} />
                            </ComposedChart>
                        )}
                        {activeView === 'development' && (
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="year" stroke="#9ca3af" />
                                <YAxis yAxisId="left" stroke="#3b82f6" tickFormatter={formatPrice} />
                                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip neighborhoodKey={selectedNeighborhood} />} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="price" name="Median Price" fill={neighborhood.color} fillOpacity={0.3} stroke={neighborhood.color} strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="condoUnits" name="Condo Units" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 3 }} />
                            </ComposedChart>
                        )}
                        {activeView === 'retail' && (
                            <ComposedChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="year" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip content={<CustomTooltip neighborhoodKey={selectedNeighborhood} />} />
                                <Legend />
                                <Bar dataKey="restaurants" name="Restaurants" stackId="a" fill="#22c55e" />
                                <Bar dataKey="boutiques" name="Boutiques" stackId="a" fill="#8b5cf6" />
                                <Bar dataKey="coffeeShops" name="Coffee" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="nightclubs" name="Nightlife" stackId="a" fill="#ef4444" />
                                <Bar dataKey="breweries" name="Breweries" stackId="a" fill="#06b6d4" />
                                <Bar dataKey="artGalleries" name="Galleries" stackId="a" fill="#ec4899" />
                            </ComposedChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                        label="Price Change"
                        value={`+${metrics.priceChange}%`}
                        sublabel={`$${(metrics.first.price / 1000).toFixed(0)}k → $${(metrics.last.price / 1000).toFixed(0)}k`}
                        icon={TrendingUp}
                        color="blue"
                    />
                    <MetricCard
                        label="Restaurants"
                        value={`+${metrics.restaurantChange}%`}
                        sublabel={`${metrics.first.restaurants} → ${metrics.last.restaurants}`}
                        icon={UtensilsCrossed}
                        color="green"
                    />
                    <MetricCard
                        label="Condo Units"
                        value={`+${metrics.condoChange}%`}
                        sublabel={`${metrics.first.condoUnits.toLocaleString()} → ${metrics.last.condoUnits.toLocaleString()}`}
                        icon={Building}
                        color="purple"
                    />
                    <MetricCard
                        label="Breweries"
                        value={`+${metrics.breweryChange}`}
                        sublabel={`${metrics.first.breweries} → ${metrics.last.breweries}`}
                        icon={Beer}
                        color="yellow"
                    />
                </div>

                {/* Timeline */}
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Key Timeline Events</h3>
                    <div className="space-y-3">
                        {data.filter(d => d.event).map((d, i) => (
                            <div key={i} className="flex items-center gap-4 text-sm">
                                <span className="text-blue-400 font-mono w-12">{d.year}</span>
                                <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: (phaseColors[d.phase] || '#475569') + '40', color: phaseColors[d.phase] || '#94a3b8' }}>
                                    {d.phase}
                                </span>
                                <span className="text-gray-300 flex-1">{d.event}</span>
                                <span className="text-gray-500">${(d.price / 1000).toFixed(0)}k</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-xs text-gray-500 text-center">
                    <p>Data synthesized from: Zillow ZHVI, SDAR Reports, Neighborhood Associations, City Development Records</p>
                </div>
            </div>
        </div>
    );
}
