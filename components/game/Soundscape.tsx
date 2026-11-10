'use client';
import {createContext} from 'react';
import type {AudioScene} from '@/lib/game/soundtrack';
export const SoundscapeContext=createContext<((scene:AudioScene)=>void)|null>(null);
