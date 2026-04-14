import { createContext, useContext } from 'react';

export const SiswaContext = createContext();

export function useSiswa() {
    return useContext(SiswaContext);
}
