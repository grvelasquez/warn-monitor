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

