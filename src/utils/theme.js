export const CARD_COLORS = {
    White: { light: '#ffffff', dark: '#1e293b' }, // White <-> Slate-800
    Gray: { light: '#f9fafb', dark: '#0f172a' }, // Gray-50 <-> Slate-900
    Blue: { light: '#eff6ff', dark: '#1e3a8a' }, // Blue-50 <-> Blue-900
    Green: { light: '#f0fdf4', dark: '#064e3b' }, // Green-50 <-> Green-900
    Yellow: { light: '#fefce8', dark: '#451a03' }, // Yellow-50 <-> Amber-950
    Red: { light: '#fef2f2', dark: '#450a0a' }, // Red-50 <-> Red-950
};

export const getCardColor = (colorName, isDarkMode) => {
    const theme = CARD_COLORS[colorName];
    if (theme) {
        return isDarkMode ? theme.dark : theme.light;
    }
    // Fallback if colorName is a hex code or unknown
    return colorName || (isDarkMode ? '#1e293b' : '#ffffff');
};

export const LINE_COLORS = [
    { name: 'Slate', value: '#64748b' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
];
