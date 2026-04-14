import { createContext, useContext } from 'react';

export const KeuanganContext = createContext();

export function useKeuangan() {
    return useContext(KeuanganContext);
}
