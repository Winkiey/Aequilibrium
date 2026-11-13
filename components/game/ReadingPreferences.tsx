'use client';
import {createContext} from 'react';
export const ReadingPreferencesContext=createContext<{instant:boolean;onChange:(instant:boolean)=>void}|null>(null);
