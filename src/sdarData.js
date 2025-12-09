// SDAR Real Estate Data - San Diego neighborhoods
export const regions = {
    all: { name: 'All San Diego County', areas: [] },
    coastal: {
        name: 'Coastal',
        areas: [
            { id: 'la-jolla', name: 'La Jolla', zips: ['92037'] },
            { id: 'del-mar', name: 'Del Mar', zips: ['92014'] },
            { id: 'solana-beach', name: 'Solana Beach', zips: ['92075'] },
            { id: 'encinitas', name: 'Encinitas', zips: ['92024'] },
            { id: 'carlsbad-west', name: 'Carlsbad West', zips: ['92008'] },
            { id: 'pacific-beach', name: 'Pacific Beach', zips: ['92109'] },
            { id: 'coronado', name: 'Coronado', zips: ['92118'] },
            { id: 'bay-park', name: 'Bay Park', zips: ['92110'] },
        ]
    },
    north: {
        name: 'North County Inland',
        areas: [
            { id: 'carlsbad-east', name: 'Carlsbad East', zips: ['92009'] },
            { id: 'san-marcos', name: 'San Marcos', zips: ['92069'] },
            { id: 'escondido', name: 'Escondido', zips: ['92025'] },
            { id: 'fallbrook', name: 'Fallbrook', zips: ['92028'] },
            { id: 'vista', name: 'Vista', zips: ['92081'] },
        ]
    },
    central: {
        name: 'Central San Diego',
        areas: [
            { id: 'carmel-valley', name: 'Carmel Valley', zips: ['92130'] },
            { id: 'del-sur', name: 'Del Sur / 4S Ranch', zips: ['92127'] },
            { id: 'rancho-bernardo', name: 'Rancho Bernardo', zips: ['92128'] },
            { id: 'poway', name: 'Poway', zips: ['92064'] },
            { id: 'scripps-ranch', name: 'Scripps Ranch', zips: ['92131'] },
            { id: 'rancho-santa-fe', name: 'Rancho Santa Fe', zips: ['92067'] },
            { id: 'clairemont', name: 'Clairemont', zips: ['92117'] },
        ]
    },
    urban: {
        name: 'Urban San Diego',
        areas: [
            { id: 'downtown', name: 'Downtown', zips: ['92101'] },
            { id: 'north-park', name: 'North Park', zips: ['92104'] },
            { id: 'hillcrest', name: 'Hillcrest', zips: ['92103'] },
            { id: 'city-heights', name: 'City Heights', zips: ['92105'] },
        ]
    },
    east: {
        name: 'East County',
        areas: [
            { id: 'la-mesa', name: 'La Mesa', zips: ['91942'] },
            { id: 'el-cajon', name: 'El Cajon', zips: ['92021'] },
            { id: 'santee', name: 'Santee', zips: ['92071'] },
            { id: 'ramona', name: 'Ramona', zips: ['92065'] },
            { id: 'spring-valley', name: 'Spring Valley', zips: ['91977'] },
        ]
    },
    south: {
        name: 'South County',
        areas: [
            { id: 'chula-vista', name: 'Chula Vista', zips: ['91910'] },
            { id: 'eastlake', name: 'Eastlake', zips: ['91913'] },
            { id: 'national-city', name: 'National City', zips: ['91950'] },
        ]
    }
};

export const neighborhoodData = {
    'all': {
        all: { medianPrice: 895500, avgPrice: 1212595, closedSales: 1586, pendingSales: 1537, newListings: 1823, daysOnMarket: 45, pctOrigPrice: 96.9, inventory: 4683, monthsSupply: 2.5, affordability: 47, priceChange: 1.1, salesChange: -9.0, domChange: 25.0, invChange: -0.1 },
        detached: { medianPrice: 1050000, avgPrice: 1440659, closedSales: 1009, pendingSales: 1010, newListings: 1108, daysOnMarket: 43, pctOrigPrice: 97.1, inventory: 2667, monthsSupply: 2.2, affordability: 40, priceChange: 3.0, salesChange: -10.7, domChange: 19.4, invChange: -6.0 },
        attached: { medianPrice: 660000, avgPrice: 813085, closedSales: 577, pendingSales: 527, newListings: 715, daysOnMarket: 49, pctOrigPrice: 96.5, inventory: 2016, monthsSupply: 3.0, affordability: 64, priceChange: -1.5, salesChange: -5.9, domChange: 32.4, invChange: 8.9 }
    },
    '92037': {
        all: { medianPrice: 2850000, avgPrice: 3450000, closedSales: 28, pendingSales: 24, newListings: 35, daysOnMarket: 52, pctOrigPrice: 95.2, inventory: 145, monthsSupply: 4.2, affordability: 15, priceChange: 2.8, salesChange: -12.5, domChange: 35.0, invChange: 8.5 },
        detached: { medianPrice: 3850000, avgPrice: 4650000, closedSales: 15, pendingSales: 12, newListings: 18, daysOnMarket: 58, pctOrigPrice: 94.5, inventory: 85, monthsSupply: 4.8, affordability: 11, priceChange: 3.5, salesChange: -15.0, domChange: 40.0, invChange: 12.0 },
        attached: { medianPrice: 1450000, avgPrice: 1680000, closedSales: 13, pendingSales: 12, newListings: 17, daysOnMarket: 45, pctOrigPrice: 96.2, inventory: 60, monthsSupply: 3.8, affordability: 29, priceChange: 1.8, salesChange: -8.5, domChange: 28.0, invChange: 5.5 }
    },
    '92014': {
        all: { medianPrice: 2650000, avgPrice: 3200000, closedSales: 18, pendingSales: 15, newListings: 22, daysOnMarket: 48, pctOrigPrice: 95.8, inventory: 85, monthsSupply: 3.8, affordability: 16, priceChange: 3.5, salesChange: -8.2, domChange: 28.0, invChange: 12.0 },
        detached: { medianPrice: 3250000, avgPrice: 3850000, closedSales: 12, pendingSales: 10, newListings: 14, daysOnMarket: 52, pctOrigPrice: 95.2, inventory: 55, monthsSupply: 4.2, affordability: 13, priceChange: 4.2, salesChange: -10.5, domChange: 32.0, invChange: 15.0 },
        attached: { medianPrice: 1350000, avgPrice: 1520000, closedSales: 6, pendingSales: 5, newListings: 8, daysOnMarket: 42, pctOrigPrice: 96.8, inventory: 30, monthsSupply: 3.2, affordability: 31, priceChange: 2.2, salesChange: -4.5, domChange: 22.0, invChange: 8.0 }
    },
    '92075': {
        all: { medianPrice: 2100000, avgPrice: 2450000, closedSales: 22, pendingSales: 19, newListings: 28, daysOnMarket: 44, pctOrigPrice: 96.1, inventory: 72, monthsSupply: 3.2, affordability: 20, priceChange: 4.2, salesChange: -5.5, domChange: 22.0, invChange: 6.5 },
        detached: { medianPrice: 2650000, avgPrice: 3050000, closedSales: 14, pendingSales: 12, newListings: 18, daysOnMarket: 48, pctOrigPrice: 95.5, inventory: 45, monthsSupply: 3.5, affordability: 16, priceChange: 5.0, salesChange: -7.2, domChange: 26.0, invChange: 8.5 },
        attached: { medianPrice: 1250000, avgPrice: 1380000, closedSales: 8, pendingSales: 7, newListings: 10, daysOnMarket: 38, pctOrigPrice: 97.2, inventory: 27, monthsSupply: 2.8, affordability: 34, priceChange: 2.8, salesChange: -2.5, domChange: 16.0, invChange: 4.0 }
    },
    '92024': {
        all: { medianPrice: 1850000, avgPrice: 2150000, closedSales: 45, pendingSales: 42, newListings: 52, daysOnMarket: 38, pctOrigPrice: 97.2, inventory: 125, monthsSupply: 2.6, affordability: 23, priceChange: 2.1, salesChange: -7.8, domChange: 18.5, invChange: -2.0 },
        detached: { medianPrice: 2350000, avgPrice: 2750000, closedSales: 28, pendingSales: 26, newListings: 32, daysOnMarket: 42, pctOrigPrice: 96.8, inventory: 78, monthsSupply: 2.8, affordability: 18, priceChange: 2.8, salesChange: -9.5, domChange: 22.0, invChange: -1.0 },
        attached: { medianPrice: 1150000, avgPrice: 1280000, closedSales: 17, pendingSales: 16, newListings: 20, daysOnMarket: 32, pctOrigPrice: 97.8, inventory: 47, monthsSupply: 2.4, affordability: 37, priceChange: 1.2, salesChange: -5.2, domChange: 14.0, invChange: -3.5 }
    },
    '92130': {
        all: { medianPrice: 1950000, avgPrice: 2250000, closedSales: 52, pendingSales: 48, newListings: 58, daysOnMarket: 32, pctOrigPrice: 98.1, inventory: 98, monthsSupply: 1.8, affordability: 22, priceChange: 1.5, salesChange: -4.2, domChange: 14.0, invChange: -5.5 },
        detached: { medianPrice: 2450000, avgPrice: 2850000, closedSales: 32, pendingSales: 30, newListings: 35, daysOnMarket: 35, pctOrigPrice: 97.8, inventory: 58, monthsSupply: 1.9, affordability: 17, priceChange: 2.2, salesChange: -5.5, domChange: 16.0, invChange: -6.5 },
        attached: { medianPrice: 1250000, avgPrice: 1380000, closedSales: 20, pendingSales: 18, newListings: 23, daysOnMarket: 28, pctOrigPrice: 98.5, inventory: 40, monthsSupply: 1.7, affordability: 34, priceChange: 0.5, salesChange: -2.2, domChange: 12.0, invChange: -4.0 }
    },
    '92127': {
        all: { medianPrice: 1650000, avgPrice: 1850000, closedSales: 48, pendingSales: 45, newListings: 55, daysOnMarket: 28, pctOrigPrice: 98.5, inventory: 85, monthsSupply: 1.7, affordability: 26, priceChange: 0.8, salesChange: -6.5, domChange: 16.0, invChange: -8.2 },
        detached: { medianPrice: 2050000, avgPrice: 2350000, closedSales: 32, pendingSales: 30, newListings: 38, daysOnMarket: 30, pctOrigPrice: 98.2, inventory: 55, monthsSupply: 1.8, affordability: 21, priceChange: 1.2, salesChange: -7.5, domChange: 18.0, invChange: -9.5 },
        attached: { medianPrice: 950000, avgPrice: 1050000, closedSales: 16, pendingSales: 15, newListings: 17, daysOnMarket: 24, pctOrigPrice: 99.1, inventory: 30, monthsSupply: 1.6, affordability: 45, priceChange: 0.2, salesChange: -4.5, domChange: 12.0, invChange: -6.0 }
    },
    '92128': {
        all: { medianPrice: 1150000, avgPrice: 1320000, closedSales: 62, pendingSales: 58, newListings: 72, daysOnMarket: 35, pctOrigPrice: 97.8, inventory: 125, monthsSupply: 2.0, affordability: 37, priceChange: 2.2, salesChange: -8.5, domChange: 20.0, invChange: 2.5 },
        detached: { medianPrice: 1450000, avgPrice: 1680000, closedSales: 38, pendingSales: 35, newListings: 45, daysOnMarket: 38, pctOrigPrice: 97.5, inventory: 75, monthsSupply: 2.1, affordability: 29, priceChange: 2.8, salesChange: -10.2, domChange: 22.0, invChange: 4.0 },
        attached: { medianPrice: 725000, avgPrice: 795000, closedSales: 24, pendingSales: 23, newListings: 27, daysOnMarket: 30, pctOrigPrice: 98.2, inventory: 50, monthsSupply: 1.9, affordability: 58, priceChange: 1.2, salesChange: -5.5, domChange: 16.0, invChange: 0.5 }
    },
    '92064': {
        all: { medianPrice: 1350000, avgPrice: 1580000, closedSales: 55, pendingSales: 52, newListings: 65, daysOnMarket: 38, pctOrigPrice: 97.5, inventory: 115, monthsSupply: 2.1, affordability: 32, priceChange: 1.8, salesChange: -5.2, domChange: 22.0, invChange: -3.5 },
        detached: { medianPrice: 1550000, avgPrice: 1820000, closedSales: 42, pendingSales: 40, newListings: 50, daysOnMarket: 40, pctOrigPrice: 97.2, inventory: 88, monthsSupply: 2.2, affordability: 27, priceChange: 2.2, salesChange: -6.5, domChange: 24.0, invChange: -4.5 },
        attached: { medianPrice: 750000, avgPrice: 825000, closedSales: 13, pendingSales: 12, newListings: 15, daysOnMarket: 32, pctOrigPrice: 98.2, inventory: 27, monthsSupply: 1.8, affordability: 56, priceChange: 0.8, salesChange: -2.5, domChange: 18.0, invChange: -1.5 }
    },
    '92131': {
        all: { medianPrice: 1450000, avgPrice: 1650000, closedSales: 42, pendingSales: 38, newListings: 48, daysOnMarket: 34, pctOrigPrice: 97.9, inventory: 78, monthsSupply: 1.9, affordability: 29, priceChange: 2.5, salesChange: -7.2, domChange: 18.0, invChange: -4.8 },
        detached: { medianPrice: 1750000, avgPrice: 2050000, closedSales: 28, pendingSales: 25, newListings: 32, daysOnMarket: 36, pctOrigPrice: 97.6, inventory: 52, monthsSupply: 2.0, affordability: 24, priceChange: 3.0, salesChange: -8.5, domChange: 20.0, invChange: -5.5 },
        attached: { medianPrice: 875000, avgPrice: 950000, closedSales: 14, pendingSales: 13, newListings: 16, daysOnMarket: 30, pctOrigPrice: 98.5, inventory: 26, monthsSupply: 1.7, affordability: 48, priceChange: 1.5, salesChange: -4.5, domChange: 14.0, invChange: -3.5 }
    },
    '92067': {
        all: { medianPrice: 4200000, avgPrice: 5500000, closedSales: 12, pendingSales: 10, newListings: 18, daysOnMarket: 85, pctOrigPrice: 92.5, inventory: 95, monthsSupply: 7.5, affordability: 10, priceChange: -1.2, salesChange: -15.0, domChange: 45.0, invChange: 18.5 },
        detached: { medianPrice: 4500000, avgPrice: 5850000, closedSales: 11, pendingSales: 9, newListings: 16, daysOnMarket: 88, pctOrigPrice: 92.2, inventory: 88, monthsSupply: 7.8, affordability: 9, priceChange: -1.5, salesChange: -16.0, domChange: 48.0, invChange: 20.0 },
        attached: { medianPrice: 1850000, avgPrice: 2150000, closedSales: 1, pendingSales: 1, newListings: 2, daysOnMarket: 65, pctOrigPrice: 95.0, inventory: 7, monthsSupply: 5.5, affordability: 23, priceChange: 0.5, salesChange: -8.0, domChange: 30.0, invChange: 10.0 }
    },
    '92101': {
        all: { medianPrice: 625000, avgPrice: 750000, closedSales: 85, pendingSales: 78, newListings: 105, daysOnMarket: 52, pctOrigPrice: 96.2, inventory: 320, monthsSupply: 3.5, affordability: 68, priceChange: -2.5, salesChange: -12.0, domChange: 35.0, invChange: 15.5 },
        detached: { medianPrice: 1150000, avgPrice: 1350000, closedSales: 8, pendingSales: 7, newListings: 12, daysOnMarket: 58, pctOrigPrice: 95.5, inventory: 35, monthsSupply: 4.0, affordability: 37, priceChange: -1.5, salesChange: -15.0, domChange: 40.0, invChange: 18.0 },
        attached: { medianPrice: 595000, avgPrice: 685000, closedSales: 77, pendingSales: 71, newListings: 93, daysOnMarket: 50, pctOrigPrice: 96.5, inventory: 285, monthsSupply: 3.4, affordability: 71, priceChange: -2.8, salesChange: -11.5, domChange: 33.0, invChange: 15.0 }
    },
    '92104': {
        all: { medianPrice: 985000, avgPrice: 1120000, closedSales: 35, pendingSales: 32, newListings: 42, daysOnMarket: 38, pctOrigPrice: 97.5, inventory: 68, monthsSupply: 1.9, affordability: 43, priceChange: 3.8, salesChange: -5.5, domChange: 22.0, invChange: -2.5 },
        detached: { medianPrice: 1250000, avgPrice: 1450000, closedSales: 18, pendingSales: 16, newListings: 22, daysOnMarket: 42, pctOrigPrice: 97.2, inventory: 35, monthsSupply: 2.0, affordability: 34, priceChange: 4.5, salesChange: -6.8, domChange: 25.0, invChange: -3.5 },
        attached: { medianPrice: 695000, avgPrice: 765000, closedSales: 17, pendingSales: 16, newListings: 20, daysOnMarket: 34, pctOrigPrice: 98.0, inventory: 33, monthsSupply: 1.8, affordability: 61, priceChange: 2.8, salesChange: -4.0, domChange: 18.0, invChange: -1.5 }
    },
    '92103': {
        all: { medianPrice: 875000, avgPrice: 980000, closedSales: 28, pendingSales: 25, newListings: 35, daysOnMarket: 42, pctOrigPrice: 97.2, inventory: 58, monthsSupply: 2.1, affordability: 48, priceChange: 2.2, salesChange: -8.2, domChange: 28.0, invChange: 5.5 },
        detached: { medianPrice: 1350000, avgPrice: 1520000, closedSales: 10, pendingSales: 9, newListings: 13, daysOnMarket: 48, pctOrigPrice: 96.5, inventory: 25, monthsSupply: 2.4, affordability: 31, priceChange: 3.0, salesChange: -10.5, domChange: 32.0, invChange: 8.0 },
        attached: { medianPrice: 625000, avgPrice: 695000, closedSales: 18, pendingSales: 16, newListings: 22, daysOnMarket: 38, pctOrigPrice: 97.8, inventory: 33, monthsSupply: 1.9, affordability: 68, priceChange: 1.5, salesChange: -6.5, domChange: 24.0, invChange: 4.0 }
    },
    '92105': {
        all: { medianPrice: 685000, avgPrice: 745000, closedSales: 42, pendingSales: 38, newListings: 52, daysOnMarket: 30, pctOrigPrice: 98.8, inventory: 72, monthsSupply: 1.7, affordability: 62, priceChange: 4.5, salesChange: -1.8, domChange: 8.0, invChange: -10.5 },
        detached: { medianPrice: 785000, avgPrice: 855000, closedSales: 25, pendingSales: 22, newListings: 30, daysOnMarket: 32, pctOrigPrice: 98.5, inventory: 42, monthsSupply: 1.8, affordability: 54, priceChange: 5.2, salesChange: -2.5, domChange: 10.0, invChange: -12.0 },
        attached: { medianPrice: 495000, avgPrice: 535000, closedSales: 17, pendingSales: 16, newListings: 22, daysOnMarket: 26, pctOrigPrice: 99.2, inventory: 30, monthsSupply: 1.5, affordability: 86, priceChange: 3.5, salesChange: -0.8, domChange: 5.0, invChange: -8.0 }
    },
    '92028': {
        all: { medianPrice: 850000, avgPrice: 950000, closedSales: 48, pendingSales: 45, newListings: 62, daysOnMarket: 42, pctOrigPrice: 97.0, inventory: 145, monthsSupply: 2.8, affordability: 50, priceChange: 1.5, salesChange: -6.8, domChange: 24.0, invChange: 8.2 },
        detached: { medianPrice: 925000, avgPrice: 1050000, closedSales: 42, pendingSales: 40, newListings: 55, daysOnMarket: 44, pctOrigPrice: 96.8, inventory: 128, monthsSupply: 2.9, affordability: 46, priceChange: 1.8, salesChange: -7.5, domChange: 26.0, invChange: 9.5 },
        attached: { medianPrice: 525000, avgPrice: 575000, closedSales: 6, pendingSales: 5, newListings: 7, daysOnMarket: 35, pctOrigPrice: 98.0, inventory: 17, monthsSupply: 2.5, affordability: 81, priceChange: 0.8, salesChange: -4.0, domChange: 18.0, invChange: 5.0 }
    },
    '92009': {
        all: { medianPrice: 1450000, avgPrice: 1680000, closedSales: 45, pendingSales: 42, newListings: 52, daysOnMarket: 32, pctOrigPrice: 98.2, inventory: 82, monthsSupply: 1.8, affordability: 29, priceChange: 1.2, salesChange: -5.8, domChange: 15.0, invChange: -6.5 },
        detached: { medianPrice: 1850000, avgPrice: 2150000, closedSales: 28, pendingSales: 26, newListings: 32, daysOnMarket: 35, pctOrigPrice: 97.8, inventory: 52, monthsSupply: 1.9, affordability: 23, priceChange: 1.5, salesChange: -6.8, domChange: 18.0, invChange: -7.5 },
        attached: { medianPrice: 895000, avgPrice: 985000, closedSales: 17, pendingSales: 16, newListings: 20, daysOnMarket: 28, pctOrigPrice: 98.8, inventory: 30, monthsSupply: 1.7, affordability: 47, priceChange: 0.8, salesChange: -4.2, domChange: 12.0, invChange: -5.0 }
    },
    '92021': {
        all: { medianPrice: 725000, avgPrice: 785000, closedSales: 38, pendingSales: 35, newListings: 48, daysOnMarket: 35, pctOrigPrice: 98.2, inventory: 85, monthsSupply: 2.2, affordability: 58, priceChange: 3.5, salesChange: -2.5, domChange: 12.0, invChange: -5.2 },
        detached: { medianPrice: 825000, avgPrice: 895000, closedSales: 28, pendingSales: 26, newListings: 35, daysOnMarket: 38, pctOrigPrice: 98.0, inventory: 62, monthsSupply: 2.3, affordability: 51, priceChange: 4.0, salesChange: -3.5, domChange: 14.0, invChange: -6.0 },
        attached: { medianPrice: 525000, avgPrice: 565000, closedSales: 10, pendingSales: 9, newListings: 13, daysOnMarket: 30, pctOrigPrice: 98.8, inventory: 23, monthsSupply: 2.0, affordability: 81, priceChange: 2.5, salesChange: -0.8, domChange: 8.0, invChange: -3.5 }
    },
    '92071': {
        all: { medianPrice: 785000, avgPrice: 850000, closedSales: 35, pendingSales: 32, newListings: 42, daysOnMarket: 32, pctOrigPrice: 98.5, inventory: 68, monthsSupply: 1.9, affordability: 54, priceChange: 4.2, salesChange: -3.8, domChange: 10.0, invChange: -8.5 },
        detached: { medianPrice: 875000, avgPrice: 950000, closedSales: 28, pendingSales: 26, newListings: 34, daysOnMarket: 34, pctOrigPrice: 98.2, inventory: 52, monthsSupply: 2.0, affordability: 48, priceChange: 4.8, salesChange: -4.5, domChange: 12.0, invChange: -9.5 },
        attached: { medianPrice: 565000, avgPrice: 615000, closedSales: 7, pendingSales: 6, newListings: 8, daysOnMarket: 28, pctOrigPrice: 99.0, inventory: 16, monthsSupply: 1.8, affordability: 75, priceChange: 3.0, salesChange: -2.0, domChange: 6.0, invChange: -6.0 }
    },
    '92065': {
        all: { medianPrice: 750000, avgPrice: 825000, closedSales: 32, pendingSales: 28, newListings: 45, daysOnMarket: 45, pctOrigPrice: 97.2, inventory: 95, monthsSupply: 2.8, affordability: 56, priceChange: 2.8, salesChange: -5.5, domChange: 28.0, invChange: 12.0 },
        detached: { medianPrice: 795000, avgPrice: 875000, closedSales: 30, pendingSales: 26, newListings: 42, daysOnMarket: 46, pctOrigPrice: 97.0, inventory: 88, monthsSupply: 2.9, affordability: 53, priceChange: 3.0, salesChange: -6.0, domChange: 30.0, invChange: 13.0 },
        attached: { medianPrice: 485000, avgPrice: 525000, closedSales: 2, pendingSales: 2, newListings: 3, daysOnMarket: 38, pctOrigPrice: 98.5, inventory: 7, monthsSupply: 2.2, affordability: 87, priceChange: 1.8, salesChange: -3.5, domChange: 18.0, invChange: 8.0 }
    },
    '91977': {
        all: { medianPrice: 695000, avgPrice: 745000, closedSales: 35, pendingSales: 32, newListings: 42, daysOnMarket: 32, pctOrigPrice: 98.8, inventory: 58, monthsSupply: 1.6, affordability: 61, priceChange: 5.2, salesChange: -1.2, domChange: 8.0, invChange: -12.0 },
        detached: { medianPrice: 785000, avgPrice: 845000, closedSales: 25, pendingSales: 23, newListings: 30, daysOnMarket: 34, pctOrigPrice: 98.5, inventory: 42, monthsSupply: 1.7, affordability: 54, priceChange: 5.8, salesChange: -2.0, domChange: 10.0, invChange: -13.5 },
        attached: { medianPrice: 495000, avgPrice: 535000, closedSales: 10, pendingSales: 9, newListings: 12, daysOnMarket: 28, pctOrigPrice: 99.2, inventory: 16, monthsSupply: 1.5, affordability: 86, priceChange: 4.0, salesChange: 0.5, domChange: 5.0, invChange: -9.0 }
    },
    '91913': {
        all: { medianPrice: 925000, avgPrice: 1020000, closedSales: 55, pendingSales: 52, newListings: 65, daysOnMarket: 28, pctOrigPrice: 99.1, inventory: 85, monthsSupply: 1.5, affordability: 46, priceChange: 2.5, salesChange: 2.8, domChange: 5.0, invChange: -15.0 },
        detached: { medianPrice: 1085000, avgPrice: 1195000, closedSales: 38, pendingSales: 36, newListings: 45, daysOnMarket: 30, pctOrigPrice: 98.8, inventory: 58, monthsSupply: 1.6, affordability: 39, priceChange: 2.8, salesChange: 3.5, domChange: 6.0, invChange: -16.5 },
        attached: { medianPrice: 675000, avgPrice: 735000, closedSales: 17, pendingSales: 16, newListings: 20, daysOnMarket: 24, pctOrigPrice: 99.5, inventory: 27, monthsSupply: 1.4, affordability: 63, priceChange: 1.8, salesChange: 1.5, domChange: 3.0, invChange: -12.0 }
    },
    '91950': {
        all: { medianPrice: 625000, avgPrice: 680000, closedSales: 22, pendingSales: 20, newListings: 28, daysOnMarket: 35, pctOrigPrice: 98.5, inventory: 42, monthsSupply: 1.8, affordability: 68, priceChange: 4.8, salesChange: -4.5, domChange: 12.0, invChange: -8.0 },
        detached: { medianPrice: 725000, avgPrice: 785000, closedSales: 12, pendingSales: 11, newListings: 15, daysOnMarket: 38, pctOrigPrice: 98.2, inventory: 25, monthsSupply: 2.0, affordability: 58, priceChange: 5.2, salesChange: -5.5, domChange: 14.0, invChange: -9.5 },
        attached: { medianPrice: 495000, avgPrice: 535000, closedSales: 10, pendingSales: 9, newListings: 13, daysOnMarket: 30, pctOrigPrice: 99.0, inventory: 17, monthsSupply: 1.6, affordability: 86, priceChange: 4.2, salesChange: -3.0, domChange: 9.0, invChange: -6.0 }
    },
    '92117': {
        all: { medianPrice: 1050000, avgPrice: 1180000, closedSales: 38, pendingSales: 35, newListings: 45, daysOnMarket: 35, pctOrigPrice: 97.8, inventory: 72, monthsSupply: 1.9, affordability: 40, priceChange: 2.2, salesChange: -6.5, domChange: 18.0, invChange: -4.2 },
        detached: { medianPrice: 1350000, avgPrice: 1520000, closedSales: 22, pendingSales: 20, newListings: 26, daysOnMarket: 38, pctOrigPrice: 97.5, inventory: 42, monthsSupply: 2.0, affordability: 31, priceChange: 2.8, salesChange: -7.8, domChange: 20.0, invChange: -5.5 },
        attached: { medianPrice: 695000, avgPrice: 765000, closedSales: 16, pendingSales: 15, newListings: 19, daysOnMarket: 30, pctOrigPrice: 98.2, inventory: 30, monthsSupply: 1.8, affordability: 61, priceChange: 1.5, salesChange: -4.5, domChange: 15.0, invChange: -2.5 }
    },
    '92109': {
        all: { medianPrice: 1350000, avgPrice: 1550000, closedSales: 32, pendingSales: 28, newListings: 42, daysOnMarket: 42, pctOrigPrice: 96.8, inventory: 95, monthsSupply: 2.8, affordability: 32, priceChange: 1.8, salesChange: -8.5, domChange: 25.0, invChange: 8.5 },
        detached: { medianPrice: 2150000, avgPrice: 2480000, closedSales: 12, pendingSales: 10, newListings: 16, daysOnMarket: 48, pctOrigPrice: 96.0, inventory: 38, monthsSupply: 3.2, affordability: 20, priceChange: 2.5, salesChange: -10.5, domChange: 30.0, invChange: 12.0 },
        attached: { medianPrice: 895000, avgPrice: 985000, closedSales: 20, pendingSales: 18, newListings: 26, daysOnMarket: 38, pctOrigPrice: 97.5, inventory: 57, monthsSupply: 2.5, affordability: 47, priceChange: 1.2, salesChange: -6.8, domChange: 20.0, invChange: 6.0 }
    },
    '92118': {
        all: { medianPrice: 2250000, avgPrice: 2800000, closedSales: 15, pendingSales: 12, newListings: 22, daysOnMarket: 58, pctOrigPrice: 95.5, inventory: 68, monthsSupply: 4.2, affordability: 19, priceChange: 0.5, salesChange: -12.0, domChange: 32.0, invChange: 15.0 },
        detached: { medianPrice: 2950000, avgPrice: 3650000, closedSales: 8, pendingSales: 6, newListings: 12, daysOnMarket: 65, pctOrigPrice: 94.8, inventory: 42, monthsSupply: 4.8, affordability: 14, priceChange: 0.8, salesChange: -14.0, domChange: 38.0, invChange: 18.0 },
        attached: { medianPrice: 1350000, avgPrice: 1520000, closedSales: 7, pendingSales: 6, newListings: 10, daysOnMarket: 48, pctOrigPrice: 96.5, inventory: 26, monthsSupply: 3.5, affordability: 31, priceChange: 0.2, salesChange: -9.5, domChange: 25.0, invChange: 11.0 }
    },
    '92008': {
        all: { medianPrice: 1250000, avgPrice: 1450000, closedSales: 28, pendingSales: 25, newListings: 35, daysOnMarket: 38, pctOrigPrice: 97.5, inventory: 65, monthsSupply: 2.2, affordability: 34, priceChange: 1.8, salesChange: -6.2, domChange: 20.0, invChange: 4.5 },
        detached: { medianPrice: 1650000, avgPrice: 1920000, closedSales: 15, pendingSales: 13, newListings: 19, daysOnMarket: 42, pctOrigPrice: 97.0, inventory: 38, monthsSupply: 2.4, affordability: 26, priceChange: 2.2, salesChange: -7.5, domChange: 24.0, invChange: 6.0 },
        attached: { medianPrice: 795000, avgPrice: 875000, closedSales: 13, pendingSales: 12, newListings: 16, daysOnMarket: 32, pctOrigPrice: 98.2, inventory: 27, monthsSupply: 2.0, affordability: 53, priceChange: 1.2, salesChange: -4.5, domChange: 15.0, invChange: 2.5 }
    },
    '92069': {
        all: { medianPrice: 775000, avgPrice: 850000, closedSales: 42, pendingSales: 38, newListings: 52, daysOnMarket: 35, pctOrigPrice: 98.0, inventory: 88, monthsSupply: 2.0, affordability: 55, priceChange: 3.2, salesChange: -4.5, domChange: 15.0, invChange: -3.5 },
        detached: { medianPrice: 895000, avgPrice: 985000, closedSales: 30, pendingSales: 28, newListings: 38, daysOnMarket: 38, pctOrigPrice: 97.8, inventory: 65, monthsSupply: 2.1, affordability: 47, priceChange: 3.5, salesChange: -5.2, domChange: 18.0, invChange: -4.5 },
        attached: { medianPrice: 545000, avgPrice: 595000, closedSales: 12, pendingSales: 10, newListings: 14, daysOnMarket: 30, pctOrigPrice: 98.5, inventory: 23, monthsSupply: 1.8, affordability: 78, priceChange: 2.5, salesChange: -3.0, domChange: 10.0, invChange: -2.0 }
    },
    '92025': {
        all: { medianPrice: 725000, avgPrice: 795000, closedSales: 38, pendingSales: 35, newListings: 48, daysOnMarket: 38, pctOrigPrice: 97.8, inventory: 92, monthsSupply: 2.3, affordability: 58, priceChange: 2.8, salesChange: -5.8, domChange: 18.0, invChange: 5.2 },
        detached: { medianPrice: 825000, avgPrice: 905000, closedSales: 28, pendingSales: 26, newListings: 35, daysOnMarket: 40, pctOrigPrice: 97.5, inventory: 68, monthsSupply: 2.4, affordability: 51, priceChange: 3.2, salesChange: -6.5, domChange: 20.0, invChange: 6.5 },
        attached: { medianPrice: 495000, avgPrice: 545000, closedSales: 10, pendingSales: 9, newListings: 13, daysOnMarket: 32, pctOrigPrice: 98.5, inventory: 24, monthsSupply: 2.1, affordability: 86, priceChange: 2.0, salesChange: -4.2, domChange: 14.0, invChange: 3.0 }
    },
    '92081': {
        all: { medianPrice: 695000, avgPrice: 765000, closedSales: 32, pendingSales: 28, newListings: 42, daysOnMarket: 35, pctOrigPrice: 98.2, inventory: 68, monthsSupply: 2.0, affordability: 61, priceChange: 3.5, salesChange: -4.2, domChange: 14.0, invChange: -2.8 },
        detached: { medianPrice: 795000, avgPrice: 875000, closedSales: 24, pendingSales: 22, newListings: 32, daysOnMarket: 38, pctOrigPrice: 98.0, inventory: 52, monthsSupply: 2.1, affordability: 53, priceChange: 3.8, salesChange: -5.0, domChange: 16.0, invChange: -3.5 },
        attached: { medianPrice: 485000, avgPrice: 525000, closedSales: 8, pendingSales: 6, newListings: 10, daysOnMarket: 30, pctOrigPrice: 98.8, inventory: 16, monthsSupply: 1.8, affordability: 87, priceChange: 2.8, salesChange: -2.5, domChange: 10.0, invChange: -1.5 }
    },
    '91942': {
        all: { medianPrice: 825000, avgPrice: 895000, closedSales: 28, pendingSales: 25, newListings: 35, daysOnMarket: 32, pctOrigPrice: 98.5, inventory: 55, monthsSupply: 1.9, affordability: 51, priceChange: 3.8, salesChange: -3.5, domChange: 12.0, invChange: -5.5 },
        detached: { medianPrice: 950000, avgPrice: 1035000, closedSales: 18, pendingSales: 16, newListings: 22, daysOnMarket: 35, pctOrigPrice: 98.2, inventory: 35, monthsSupply: 2.0, affordability: 45, priceChange: 4.2, salesChange: -4.2, domChange: 14.0, invChange: -6.5 },
        attached: { medianPrice: 595000, avgPrice: 645000, closedSales: 10, pendingSales: 9, newListings: 13, daysOnMarket: 28, pctOrigPrice: 99.0, inventory: 20, monthsSupply: 1.8, affordability: 71, priceChange: 3.0, salesChange: -2.2, domChange: 8.0, invChange: -4.0 }
    },
    '91910': {
        all: { medianPrice: 750000, avgPrice: 825000, closedSales: 45, pendingSales: 42, newListings: 55, daysOnMarket: 32, pctOrigPrice: 98.5, inventory: 78, monthsSupply: 1.7, affordability: 56, priceChange: 3.2, salesChange: -2.8, domChange: 10.0, invChange: -8.2 },
        detached: { medianPrice: 875000, avgPrice: 965000, closedSales: 30, pendingSales: 28, newListings: 38, daysOnMarket: 35, pctOrigPrice: 98.2, inventory: 52, monthsSupply: 1.8, affordability: 48, priceChange: 3.5, salesChange: -3.5, domChange: 12.0, invChange: -9.5 },
        attached: { medianPrice: 545000, avgPrice: 595000, closedSales: 15, pendingSales: 14, newListings: 17, daysOnMarket: 28, pctOrigPrice: 99.0, inventory: 26, monthsSupply: 1.6, affordability: 78, priceChange: 2.5, salesChange: -1.5, domChange: 7.0, invChange: -6.0 }
    },
    '92110': {
        all: { medianPrice: 1125000, avgPrice: 1285000, closedSales: 32, pendingSales: 28, newListings: 38, daysOnMarket: 36, pctOrigPrice: 97.6, inventory: 65, monthsSupply: 2.0, affordability: 38, priceChange: 2.8, salesChange: -5.2, domChange: 18.0, invChange: -3.5 },
        detached: { medianPrice: 1385000, avgPrice: 1580000, closedSales: 18, pendingSales: 15, newListings: 22, daysOnMarket: 40, pctOrigPrice: 97.2, inventory: 38, monthsSupply: 2.1, affordability: 31, priceChange: 3.2, salesChange: -6.5, domChange: 22.0, invChange: -4.5 },
        attached: { medianPrice: 725000, avgPrice: 795000, closedSales: 14, pendingSales: 13, newListings: 16, daysOnMarket: 30, pctOrigPrice: 98.2, inventory: 27, monthsSupply: 1.8, affordability: 58, priceChange: 2.2, salesChange: -3.2, domChange: 12.0, invChange: -2.0 }
    }
};
