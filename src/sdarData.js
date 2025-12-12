// SDAR Real Estate Data - San Diego neighborhoods (SDAR Official Regions)
export const regions = {
    all: { name: 'All San Diego County', areas: [] },
    northCoast: {
        name: 'North Coast',
        areas: [
            { id: 'carlsbad-nw', name: 'Carlsbad NW', zips: ['92008'] },
            { id: 'carlsbad-sw', name: 'Carlsbad SW', zips: ['92011'] },
            { id: 'carlsbad-se', name: 'Carlsbad SE', zips: ['92009'] },
            { id: 'carlsbad-ne', name: 'Carlsbad NE', zips: ['92010'] },
            { id: 'encinitas', name: 'Encinitas', zips: ['92024'] },
            { id: 'del-mar', name: 'Del Mar', zips: ['92014'] },
            { id: 'solana-beach', name: 'Solana Beach', zips: ['92075'] },
            { id: 'cardiff', name: 'Cardiff', zips: ['92007'] },
            { id: 'oceanside-south', name: 'Oceanside South', zips: ['92054'] },
            { id: 'oceanside-east', name: 'Oceanside East', zips: ['92056'] },
            { id: 'oceanside-north', name: 'Oceanside North', zips: ['92057'] },
            { id: 'oceanside-central', name: 'Oceanside Central', zips: ['92058'] },
        ]
    },
    northInland: {
        name: 'North Inland',
        areas: [
            { id: 'san-marcos-south', name: 'San Marcos South', zips: ['92069', '92078'] },
            { id: 'escondido-south', name: 'Escondido South', zips: ['92025'] },
            { id: 'escondido-north', name: 'Escondido North', zips: ['92026'] },
            { id: 'escondido-east', name: 'Escondido East', zips: ['92027'] },
            { id: 'escondido-west', name: 'Escondido West', zips: ['92029'] },
            { id: 'fallbrook', name: 'Fallbrook', zips: ['92028'] },
            { id: 'vista-south', name: 'Vista South', zips: ['92081'] },
            { id: 'vista-west', name: 'Vista West', zips: ['92083'] },
            { id: 'vista-east', name: 'Vista East', zips: ['92084'] },
            { id: 'valley-center', name: 'Valley Center', zips: ['92082'] },
            { id: 'ramona', name: 'Ramona', zips: ['92065'] },
            { id: 'poway', name: 'Poway', zips: ['92064'] },
            { id: 'rancho-santa-fe', name: 'Rancho Santa Fe', zips: ['92067', '92091'] },
        ]
    },
    centralCoastal: {
        name: 'Central Coastal',
        areas: [
            { id: 'la-jolla', name: 'La Jolla', zips: ['92037'] },
            { id: 'pacific-beach', name: 'Pacific Beach / Mission Beach', zips: ['92109'] },
            { id: 'ocean-beach', name: 'Ocean Beach', zips: ['92107'] },
            { id: 'point-loma', name: 'Point Loma', zips: ['92106'] },
            { id: 'coronado', name: 'Coronado', zips: ['92118'] },
        ]
    },
    central: {
        name: 'Central',
        areas: [
            { id: 'carmel-valley', name: 'Carmel Valley', zips: ['92130'] },
            { id: 'del-sur', name: 'Del Sur / 4S Ranch', zips: ['92127'] },
            { id: 'rancho-bernardo-east', name: 'Rancho Bernardo East', zips: ['92128'] },
            { id: 'scripps-ranch', name: 'Scripps Ranch', zips: ['92131'] },
            { id: 'penasquitos', name: 'Penasquitos', zips: ['92129'] },
            { id: 'mira-mesa', name: 'Mira Mesa', zips: ['92126'] },
            { id: 'university-city', name: 'University City', zips: ['92122'] },
            { id: 'clairemont', name: 'Clairemont', zips: ['92117'] },
            { id: 'serra-mesa', name: 'Serra Mesa', zips: ['92123'] },
            { id: 'tierrasanta', name: 'Tierrasanta', zips: ['92124'] },
            { id: 'mission-valley', name: 'Mission Valley', zips: ['92108'] },
            { id: 'linda-vista', name: 'Linda Vista', zips: ['92111'] },
            { id: 'morena', name: 'Morena / Bay Park', zips: ['92110'] },
            { id: 'downtown', name: 'Downtown', zips: ['92101'] },
            { id: 'hillcrest', name: 'Hillcrest / Mission Hills', zips: ['92103'] },
            { id: 'north-park', name: 'North Park', zips: ['92104'] },
            { id: 'city-heights', name: 'City Heights', zips: ['92105'] },
            { id: 'golden-hill', name: 'Golden Hill / South Park', zips: ['92102'] },
            { id: 'kensington', name: 'Kensington / Normal Heights', zips: ['92116'] },
        ]
    },
    eastSuburbs: {
        name: 'East Suburbs',
        areas: [
            { id: 'san-carlos', name: 'San Carlos', zips: ['92119'] },
            { id: 'allied-gardens', name: 'Allied Gardens / Del Cerro', zips: ['92120'] },
            { id: 'college', name: 'College', zips: ['92115'] },
            { id: 'la-mesa-mount-helix', name: 'La Mesa / Mount Helix', zips: ['91941'] },
            { id: 'la-mesa-grossmont', name: 'La Mesa / Grossmont', zips: ['91942'] },
            { id: 'lemon-grove', name: 'Lemon Grove', zips: ['91945'] },
        ]
    },
    eastCounty: {
        name: 'East County',
        areas: [
            { id: 'santee', name: 'Santee', zips: ['92071'] },
            { id: 'lakeside', name: 'Lakeside', zips: ['92040'] },
            { id: 'alpine', name: 'Alpine', zips: ['91901'] },
            { id: 'jamul', name: 'Jamul', zips: ['91935'] },
        ]
    },
    southBay: {
        name: 'South Bay',
        areas: [
            { id: 'chula-vista-north', name: 'Chula Vista North', zips: ['91910'] },
            { id: 'chula-vista-south', name: 'Chula Vista South', zips: ['91911'] },
            { id: 'chula-vista-eastlake', name: 'Chula Vista Eastlake', zips: ['91913'] },
            { id: 'chula-vista-ne', name: 'Chula Vista NE', zips: ['91914'] },
            { id: 'chula-vista-se', name: 'Chula Vista SE', zips: ['91915'] },
            { id: 'bonita', name: 'Bonita', zips: ['91902'] },
            { id: 'national-city', name: 'National City', zips: ['91950'] },
            { id: 'imperial-beach', name: 'Imperial Beach', zips: ['91932'] },
            { id: 'san-ysidro', name: 'San Ysidro', zips: ['92173'] },
            { id: 'nestor-otay', name: 'Nestor / Otay Mesa', zips: ['92154'] },
            { id: 'paradise-hills', name: 'Paradise Hills', zips: ['92139'] },
            { id: 'encanto', name: 'Encanto', zips: ['92114'] },
            { id: 'logan-heights', name: 'Logan Heights', zips: ['92113'] },
        ]
    }
};
