"use client"

import { useState, useEffect } from 'react'
import { timetableStore } from './timetableStore'
import { TimetableSlot, mockTimetable } from './mockData'

/**
 * Hook to access and manage timetable data
 * 
 * For admin users: Returns timetable data and update function
 * For teachers/students: Returns read-only timetable data that auto-updates
 * 
 * @param role - User role: 'admin', 'teacher', or 'student'
 * @returns Timetable data and optional update function (admin only)
 */
export function useTimetable(role: 'admin' | 'teacher' | 'student' = 'student') {
    const [timetable, setTimetable] = useState<TimetableSlot[]>([])
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        // Initialize with mock data if empty
        timetableStore.initializeTimetable(mockTimetable)

        // Load initial data
        const initialData = timetableStore.getTimetable()
        setTimetable(initialData)
        setIsInitialized(true)

        // Subscribe to changes
        const unsubscribe = timetableStore.subscribe(() => {
            const updatedData = timetableStore.getTimetable()
            setTimetable(updatedData)
        })

        return unsubscribe
    }, [])

    // Only admins can update timetable
    const updateTimetable = role === 'admin'
        ? (newTimetable: TimetableSlot[]) => {
            timetableStore.setTimetable(newTimetable)
        }
        : undefined

    return {
        timetable,
        updateTimetable,
        isInitialized
    }
}
