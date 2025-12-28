/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';

export type Language = 'en' | 'es';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

export const translations: Translations = {
    en: {
        // Header
        language: 'English',
        edit: 'Edit',
        presets: 'Presets',
        yourChatterBots: 'Your ChatterBots',
        noneYet: 'None yet.',
        newChatterBot: 'New ChatterBot',
        yourName: 'Your name',
        // UserSettings
        userSettingsTitle:
            'This is a simple tool that allows you to design, test, and banter with custom AI characters on the fly.',
        optionalInfo: 'Adding this optional info makes the experience more fun:',
        yourInfo: 'Your info',
        namePlaceholder: 'What do you like to be called?',
        infoPlaceholder:
            'Things we should know about you… Likes, dislikes, hobbies, interests, favorite movies, books, tv shows, foods, etc.',
        letsGo: 'Let’s go!',
        // AgentEdit
        name: 'Name',
        personality: 'Personality',
        personalityPlaceholder:
            'How should I act? Whatʼs my purpose? How would you describe my personality?',
        voice: 'Voice',
        selectColor: 'Select color',
        // ControlTray
        streaming: 'Streaming',
        // ErrorScreen
        errorGeneric: 'Something went wrong. Please try again.',
        errorQuota:
            'Gemini Live API in AI Studio has a limited free quota each day. Come back tomorrow to continue.',
        close: 'Close',
    },
    es: {
        // Header
        language: 'Español',
        edit: 'Editar',
        presets: 'Preajustes',
        yourChatterBots: 'Tus ChatterBots',
        noneYet: 'Aún no hay ninguno.',
        newChatterBot: 'Nuevo ChatterBot',
        yourName: 'Tu nombre',
        // UserSettings
        userSettingsTitle:
            'Esta es una herramienta sencilla que te permite diseñar, probar y charlar con personajes de IA personalizados sobre la marcha.',
        optionalInfo: 'Agregar esta información opcional hace que la experiencia sea más divertida:',
        yourInfo: 'Tu información',
        namePlaceholder: '¿Cómo te gustaría que te llamen?',
        infoPlaceholder:
            'Cosas que deberíamos saber sobre ti... Gustos, aversiones, pasatiempos, intereses, películas favoritas, libros, programas de televisión, comidas, etc.',
        letsGo: '¡Vamos!',
        // AgentEdit
        name: 'Nombre',
        personality: 'Personalidad',
        personalityPlaceholder:
            '¿Cómo debo actuar? ¿Cuál es mi propósito? ¿Cómo describirías mi personalidad?',
        voice: 'Voz',
        selectColor: 'Seleccionar color',
        // ControlTray
        streaming: 'Transmitiendo',
        // ErrorScreen
        errorGeneric: 'Algo salió mal. Por favor, inténtalo de nuevo.',
        errorQuota:
            'La API de Gemini Live en AI Studio tiene una cuota gratuita limitada cada día. Vuelve mañana para continuar.',
        close: 'Cerrar',
    },
};

export const useLanguage = create<{
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => string;
}>(set => ({
    language: 'en', // Default to English
    setLanguage: (language: Language) => set({ language }),
    t: (key: string) => {
        // We access the state inside the function to get the current language
        // But since this is inside the store creator, we can't easily access 'get'.
        // A common pattern with Zustand for this simple case is just exposing the dictionary
        // or a hook wrapper.
        // Let's simplify: return the dictionary object in the component instead of a t function here
        // or use a separate hook.
        return key;
    },
}));

// Helper hook to get translations
export function useTranslation() {
    const { language, setLanguage } = useLanguage();
    return {
        language,
        setLanguage,
        t: (key: keyof typeof translations['en']) => translations[language][key],
    };
}
