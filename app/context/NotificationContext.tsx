'use client';

import { useContext, useState, createContext, Dispatch, SetStateAction } from "react";
// The type of the Notification controlle
interface NotificationContextType {
    content: string | null
    isOpen: boolean
}

// The type to be passed in the notification (in value)
interface NotificationProviderValueType {
    notification: NotificationContextType,
    setNotification: Dispatch<SetStateAction<NotificationContextType>>
    showNotification: (content: string) => void
}

// Create the context
const NotificationContext = createContext<NotificationProviderValueType | undefined>(undefined);

// Create the provider and pass the controller to every child in provider
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    // Notification controller
    const [notification, setNotification] = useState<NotificationContextType>({ content: null, isOpen: false });
    const notificationSound = typeof window !== 'undefined' ? new Audio('/sound/notification.wav') : null;
    if (notificationSound) {
        // 2. Giảm âm lượng tại đây (Ví dụ: 0.3 là 30% âm lượng)
        notificationSound.volume = 0.3;
    }
    const showNotification = (content: string) => {
        notificationSound!.play();
        setNotification({ content, isOpen: true });
        setTimeout(() => {
            setNotification({ content: null, isOpen: false });
        }, 3000)
    }
    return (
        <NotificationContext.Provider value={{ notification, setNotification, showNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
// Custom hook to get the challenge controller from the context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("Must be wrapped within the provider");
    }
    return context;
}