/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                teasntrees: ['"Please Dont Take My Man"', 'cursive', 'sans-serif'],
                brand: ['"Please Dont Take My Man"', 'cursive', 'sans-serif'],
                please: ['"Please Dont Take My Man"', 'cursive', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#F5F8EF',
                    100: '#E9F0DB',
                    200: '#D4E3BC',
                    300: '#BED69D',
                    400: '#A9C97E',
                    500: '#94B741',
                    600: '#56763D',
                    700: '#466031',
                    800: '#364A26',
                    900: '#26341B',
                },
                emerald: {
                    50: '#F5F8EF',
                    100: '#E9F0DB',
                    200: '#D4E3BC',
                    300: '#BED69D',
                    400: '#A9C97E',
                    500: '#94B741',
                    600: '#56763D',
                    700: '#466031',
                    800: '#364A26',
                    900: '#26341B',
                },
                green: {
                    50: '#F5F8EF',
                    100: '#E9F0DB',
                    200: '#D4E3BC',
                    300: '#BED69D',
                    400: '#A9C97E',
                    500: '#94B741',
                    600: '#56763D',
                    700: '#466031',
                    800: '#364A26',
                    900: '#26341B',
                },
                tnt: {
                    light: '#94B741',
                    dark: '#56763D',
                    primary: '#56763D',
                    secondary: '#94B741',
                }
            },
        },
    },
    plugins: [],
}
