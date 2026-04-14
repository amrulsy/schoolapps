import { createContext, useContext } from 'react';

export const UiContext = createContext();

export function useUi() {
    return useContext(UiContext);
}
