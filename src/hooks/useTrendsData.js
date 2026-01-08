import { useState, useEffect, useMemo } from 'react';

// Mock data representing merged School District Demographics + Real Estate Market Data
const MOCK_GENTRIFICATION_DATA = [
    {
        year: 2018,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 585000,
        enrollment: 128000,
        diversityIndex: 0.72,
        minorityPercent: 78,
        demographicBreakdown: {
            hispanic: 46,
            white: 22,
            asian: 12,
            black: 10,
            other: 10
        }
    },
    {
        year: 2019,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 615000,
        enrollment: 125500,
        diversityIndex: 0.71,
        minorityPercent: 77,
        demographicBreakdown: {
            hispanic: 45,
            white: 23,
            asian: 12,
            black: 10,
            other: 10
        }
    },
    {
        year: 2020,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 650000,
        enrollment: 121000,
        diversityIndex: 0.69,
        minorityPercent: 75,
        demographicBreakdown: {
            hispanic: 44,
            white: 25,
            asian: 12,
            black: 9,
            other: 10
        }
    },
    {
        year: 2021,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 725000,
        enrollment: 118500,
        diversityIndex: 0.67,
        minorityPercent: 73,
        demographicBreakdown: {
            hispanic: 43,
            white: 27,
            asian: 12,
            black: 8,
            other: 10
        }
    },
    {
        year: 2022,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 825000,
        enrollment: 115000,
        diversityIndex: 0.64,
        minorityPercent: 70,
        demographicBreakdown: {
            hispanic: 41,
            white: 30,
            asian: 12,
            black: 7,
            other: 10
        }
    },
    {
        year: 2023,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 875000,
        enrollment: 112000,
        diversityIndex: 0.62,
        minorityPercent: 68,
        demographicBreakdown: {
            hispanic: 40,
            white: 32,
            asian: 11,
            black: 7,
            other: 10
        }
    },
    {
        year: 2024,
        districtId: "SD_unified",
        districtName: "San Diego Unified",
        medianPrice: 895000,
        enrollment: 109500,
        diversityIndex: 0.60,
        minorityPercent: 66,
        demographicBreakdown: {
            hispanic: 39,
            white: 34,
            asian: 11,
            black: 6,
            other: 10
        }
    }
];

// Multi-district data for map visualization
const DISTRICT_DATA = [
    { districtId: "SD_unified", name: "San Diego Unified", lat: 32.7157, lon: -117.1611, priceVelocity: 8.2, enrollmentVelocity: -3.5, riskScore: 0.78 },
    { districtId: "sweetwater", name: "Sweetwater Union", lat: 32.6401, lon: -117.0842, priceVelocity: 6.8, enrollmentVelocity: -2.1, riskScore: 0.52 },
    { districtId: "poway", name: "Poway Unified", lat: 32.9628, lon: -117.0359, priceVelocity: 9.5, enrollmentVelocity: -1.2, riskScore: 0.45 },
    { districtId: "grossmont", name: "Grossmont Union", lat: 32.7948, lon: -116.9625, priceVelocity: 5.4, enrollmentVelocity: -4.2, riskScore: 0.68 },
    { districtId: "carlsbad", name: "Carlsbad Unified", lat: 33.1581, lon: -117.3506, priceVelocity: 7.2, enrollmentVelocity: 1.5, riskScore: 0.25 },
    { districtId: "oceanside", name: "Oceanside Unified", lat: 33.1959, lon: -117.3795, priceVelocity: 6.1, enrollmentVelocity: -3.8, riskScore: 0.65 },
    { districtId: "vista", name: "Vista Unified", lat: 33.2000, lon: -117.2425, priceVelocity: 5.8, enrollmentVelocity: -2.8, riskScore: 0.55 },
    { districtId: "escondido", name: "Escondido Union", lat: 33.1192, lon: -117.0864, priceVelocity: 4.9, enrollmentVelocity: -1.8, riskScore: 0.42 },
];

/**
 * Calculate Year-over-Year velocity (percentage change)
 */
function calculateVelocity(data, field) {
    return data.map((item, idx) => {
        if (idx === 0) {
            return { ...item, [`${field}Velocity`]: 0 };
        }
        const prevValue = data[idx - 1][field];
        const currValue = item[field];
        const velocity = ((currValue - prevValue) / prevValue) * 100;
        return { ...item, [`${field}Velocity`]: parseFloat(velocity.toFixed(2)) };
    });
}

/**
 * Calculate displacement risk score based on price and enrollment changes
 * High price increase + enrollment decrease = high risk
 */
function calculateDisplacementRisk(priceVelocity, enrollmentVelocity) {
    // Normalize: price increase is positive risk, enrollment decrease is positive risk
    const priceRisk = Math.max(0, priceVelocity) / 15; // Cap at 15% increase
    const enrollmentRisk = Math.max(0, -enrollmentVelocity) / 10; // Cap at 10% decrease

    // Combined weighted score
    const risk = (priceRisk * 0.6) + (enrollmentRisk * 0.4);
    return Math.min(1, Math.max(0, risk)); // Clamp between 0-1
}

/**
 * Custom hook for fetching and processing gentrification data
 */
export function useTrendsData(selectedDistrictId = "SD_unified") {
    const [rawData, setRawData] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Simulate API fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // In production, this would be an API call
                setRawData(MOCK_GENTRIFICATION_DATA);
                setDistricts(DISTRICT_DATA);
            } catch (err) {
                setError(err.message || 'Failed to fetch gentrification data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDistrictId]);

    // Process data with velocity calculations
    const processedData = useMemo(() => {
        if (rawData.length === 0) return [];

        // Calculate velocity for price and enrollment
        let dataWithPriceVelocity = calculateVelocity(rawData, 'medianPrice');
        let dataWithAllVelocity = calculateVelocity(dataWithPriceVelocity, 'enrollment');

        // Add minority velocity
        dataWithAllVelocity = calculateVelocity(dataWithAllVelocity, 'minorityPercent');

        // Add displacement risk score
        return dataWithAllVelocity.map(item => ({
            ...item,
            displacementRisk: calculateDisplacementRisk(
                item.medianPriceVelocity || 0,
                item.enrollmentVelocity || 0
            )
        }));
    }, [rawData]);

    // Summary statistics
    const summary = useMemo(() => {
        if (processedData.length < 2) return null;

        const first = processedData[0];
        const last = processedData[processedData.length - 1];

        const totalPriceChange = ((last.medianPrice - first.medianPrice) / first.medianPrice) * 100;
        const totalEnrollmentChange = ((last.enrollment - first.enrollment) / first.enrollment) * 100;
        const totalMinorityChange = last.minorityPercent - first.minorityPercent;

        const avgPriceVelocity = processedData.slice(1).reduce((sum, d) => sum + (d.medianPriceVelocity || 0), 0) / (processedData.length - 1);
        const avgEnrollmentVelocity = processedData.slice(1).reduce((sum, d) => sum + (d.enrollmentVelocity || 0), 0) / (processedData.length - 1);

        return {
            period: `${first.year} - ${last.year}`,
            totalPriceChange: parseFloat(totalPriceChange.toFixed(1)),
            totalEnrollmentChange: parseFloat(totalEnrollmentChange.toFixed(1)),
            totalMinorityChange: parseFloat(totalMinorityChange.toFixed(1)),
            avgPriceVelocity: parseFloat(avgPriceVelocity.toFixed(2)),
            avgEnrollmentVelocity: parseFloat(avgEnrollmentVelocity.toFixed(2)),
            currentRisk: last.displacementRisk
        };
    }, [processedData]);

    return {
        data: processedData,
        districts,
        summary,
        loading,
        error,
        // Utility function exposed for external calculations
        calculateVelocity,
        calculateDisplacementRisk
    };
}

export default useTrendsData;
