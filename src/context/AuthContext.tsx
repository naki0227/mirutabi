'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User as FirestoreUser } from '@/types/firestore';
import { getUser, createUser } from '@/lib/db';
import { Timestamp } from 'firebase/firestore';

interface AuthContextType {
    user: FirebaseUser | null;
    firestoreUser: FirestoreUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    refreshFirestoreUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firestoreUser: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    refreshFirestoreUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchFirestoreUser = async (uid: string, currentUser?: FirebaseUser) => {
        try {
            let userData = await getUser(uid);
            if (!userData && currentUser) {
                // Create new user if not exists
                const newUser: FirestoreUser = {
                    user_id: uid,
                    email: currentUser.email || undefined,
                    display_name: currentUser.displayName || undefined,
                    photo_url: currentUser.photoURL || undefined,
                    followers_count: 0,
                    push_settings: {
                        price_alert: false,
                        reminder: false,
                    },
                    created_at: Timestamp.now(),
                    updated_at: Timestamp.now(),
                };
                await createUser(newUser);
                userData = newUser;
            }
            setFirestoreUser(userData);
        } catch (error) {
            console.error('Error fetching firestore user:', error);
        }
    };

    useEffect(() => {
        console.log('AuthContext: Setting up onAuthStateChanged');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('AuthContext: onAuthStateChanged triggered', user ? 'User logged in' : 'No user');
            setUser(user);
            if (user) {
                console.log('AuthContext: Fetching Firestore user...');
                try {
                    await fetchFirestoreUser(user.uid, user);
                    console.log('AuthContext: Firestore user fetched');
                } catch (e) {
                    console.error('AuthContext: Error fetching Firestore user', e);
                }
            } else {
                setFirestoreUser(null);
            }
            setLoading(false);
            console.log('AuthContext: Loading set to false');
        });

        return () => unsubscribe();
    }, []);

    const refreshFirestoreUser = async () => {
        if (user) {
            await fetchFirestoreUser(user.uid);
        }
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Error signing in with Google', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setFirestoreUser(null);
        } catch (error) {
            console.error('Error signing out', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, firestoreUser, loading, signInWithGoogle, logout, refreshFirestoreUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
