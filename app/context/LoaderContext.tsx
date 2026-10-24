'use client';

import { useContext, useState, createContext, Dispatch, SetStateAction } from "react";
// The type of the Notification controlle

// The type to be passed in the notification (in value)
interface LoaderProviderValueType {
    isOpenLoader: boolean,
    setIsOpenLoader: Dispatch<SetStateAction<boolean>>
}

// Create the context
const LoaderContext = createContext<LoaderProviderValueType | undefined>(undefined);

// Create the provider and pass the controller to every child in provider
export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
    // Notification controller
    const [isOpenLoader, setIsOpenLoader] = useState<boolean>(false);

    return (
        <LoaderContext.Provider value={{ isOpenLoader, setIsOpenLoader, }}>
            {children}
        </LoaderContext.Provider>
    );
};
// Custom hook to get the challenge controller from the context
export const useLoader = () => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error("Must be wrapped within the provider");
    }
    return context;
}