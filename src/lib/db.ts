import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    DocumentData,
    QueryConstraint,
    Timestamp,
    deleteDoc,
    runTransaction,
    Transaction
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { User, Spot, Video, Route, Comment, Post } from '@/types/firestore';

// ... (existing imports and code)

export const uploadPostMedia = (
    userId: string,
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> => {
    console.log('Starting upload for:', file.name, 'Size:', file.size);
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload progress:', progress);
                if (onProgress) onProgress(progress);

                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                console.error('Upload failed:', error);
                // Handle specific error codes
                switch (error.code) {
                    case 'storage/unauthorized':
                        reject(new Error('User doesn\'t have permission to access the object'));
                        break;
                    case 'storage/canceled':
                        reject(new Error('User canceled the upload'));
                        break;
                    case 'storage/unknown':
                        reject(new Error('Unknown error occurred, inspect error.serverResponse'));
                        break;
                    default:
                        reject(error);
                }
            },
            async () => {
                console.log('Upload completed successfully');
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (e) {
                    console.error('Error getting download URL:', e);
                    reject(e);
                }
            }
        );
    });
};

export const deletePost = async (postId: string, mediaUrl: string) => {
    // Delete from Firestore
    await deleteDoc(doc(postsCol, postId));

    // Delete from Storage
    try {
        const storageRef = ref(storage, mediaUrl);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting media file:', error);
        // Continue even if storage deletion fails (e.g. file not found)
    }
};

export const updatePost = async (postId: string, data: Partial<Post>) => {
    const docRef = doc(postsCol, postId);
    const cleanedData = removeUndefined(data);
    await updateDoc(docRef, cleanedData);
};

// Collection References
export const usersCol = collection(db, 'users');
export const spotsCol = collection(db, 'spots');
export const videosCol = collection(db, 'videos');
export const routesCol = collection(db, 'routes');

// User Helpers
export const getUser = async (userId: string): Promise<User | null> => {
    const docRef = doc(usersCol, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as User;
    }
    return null;
};

export const createUser = async (user: User) => {
    await setDoc(doc(usersCol, user.user_id), user);
};

export const updateUser = async (userId: string, data: Partial<User>) => {
    const docRef = doc(usersCol, userId);
    await updateDoc(docRef, data);
};

// Spot Helpers
export const getSpot = async (spotId: string): Promise<Spot | null> => {
    const docRef = doc(spotsCol, spotId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as Spot;
    }
    return null;
};

// Generic Helper (Example)
export const getDocuments = async <T>(
    colRef: any,
    constraints: QueryConstraint[] = []
): Promise<T[]> => {
    const q = query(colRef, ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
};

// Helper to remove undefined values (Firestore doesn't support them)
const removeUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
    } else if (obj !== null && typeof obj === 'object') {
        // Handle Firestore Timestamp and other special objects that shouldn't be traversed
        if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
            return obj;
        }
        return Object.entries(obj).reduce((acc: any, [key, value]) => {
            if (value !== undefined) {
                acc[key] = removeUndefined(value);
            }
            return acc;
        }, {});
    }
    return obj;
};

// Route Helpers
export const saveRoute = async (route: Omit<Route, 'route_id'>) => {
    const cleanedRoute = removeUndefined(route);
    const docRef = await addDoc(routesCol, cleanedRoute);
    // Add the generated ID to the document
    await updateDoc(docRef, { route_id: docRef.id });
    return docRef.id;
};

export const getUserRoutes = async (userId: string): Promise<Route[]> => {
    const q = query(routesCol, where('creator_id', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Route);
};

export const getRoute = async (routeId: string): Promise<Route | null> => {
    const docRef = doc(routesCol, routeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as Route;
    }
    return null;
};

export const updateRoute = async (routeId: string, data: Partial<Route>) => {
    const docRef = doc(routesCol, routeId);
    const cleanedData = removeUndefined(data);
    await updateDoc(docRef, cleanedData);
};

export const getPublicRoutes = async (): Promise<Route[]> => {
    const q = query(routesCol, where('is_public', '==', true), orderBy('created_at', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Route);
};

export const incrementLike = async (routeId: string, currentLikes: number) => {
    const docRef = doc(routesCol, routeId);
    await updateDoc(docRef, { likes_count: currentLikes + 1 });
};

// Comment Helpers
export const commentsCol = collection(db, 'comments');

export const addComment = async (comment: Omit<Comment, 'comment_id'>) => {
    const cleanedComment = removeUndefined(comment);
    const docRef = await addDoc(commentsCol, cleanedComment);
    await updateDoc(docRef, { comment_id: docRef.id });
    return docRef.id;
};

export const getComments = async (routeId: string): Promise<Comment[]> => {
    const q = query(commentsCol, where('route_id', '==', routeId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Comment);
};

export const getPostComments = async (postId: string): Promise<Comment[]> => {
    const q = query(commentsCol, where('post_id', '==', postId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Comment);
};

// Storage Helpers
export const uploadRouteImage = async (routeId: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `routes/${routeId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            null,
            (error) => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                // Update route document with new image URL
                const routeRef = doc(routesCol, routeId);
                const routeSnap = await getDoc(routeRef);
                if (routeSnap.exists()) {
                    const routeData = routeSnap.data() as Route;
                    const currentImages = routeData.images || [];
                    await updateDoc(routeRef, { images: [...currentImages, downloadURL] });
                }
                resolve(downloadURL);
            }
        );
    });
};

// Post Helpers
export const postsCol = collection(db, 'posts');

export const createPost = async (post: Omit<Post, 'post_id'>) => {
    const cleanedPost = removeUndefined(post);
    const docRef = await addDoc(postsCol, cleanedPost);
    await updateDoc(docRef, { post_id: docRef.id });
    return docRef.id;
};

export const getPosts = async (limitCount: number = 20): Promise<Post[]> => {
    const q = query(postsCol, orderBy('created_at', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Post);
};

// ... (existing code)

export const getReels = async (limitCount: number = 20): Promise<Post[]> => {
    const q = query(postsCol, where('media_type', '==', 'video'), orderBy('created_at', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Post);
};

// Profile Image Helper
export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            null,
            (error) => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                // Update Firestore
                await updateUser(userId, { photo_url: downloadURL });

                // Update Auth Profile if current user
                if (auth.currentUser && auth.currentUser.uid === userId) {
                    await updateProfile(auth.currentUser, { photoURL: downloadURL });
                }

                resolve(downloadURL);
            }
        );
    });
};

// Like System Helpers (Routes)
export const toggleLikeRoute = async (routeId: string, userId: string): Promise<boolean> => {
    const likeRef = doc(db, 'routes', routeId, 'likes', userId);
    const routeRef = doc(routesCol, routeId);
    const likeSnap = await getDoc(likeRef);
    const isLiked = likeSnap.exists();

    await runTransaction(db, async (transaction) => {
        const routeDoc = await transaction.get(routeRef);
        if (!routeDoc.exists()) throw "Route does not exist!";

        const currentLikes = routeDoc.data().likes_count || 0;

        if (isLiked) {
            transaction.delete(likeRef);
            transaction.update(routeRef, { likes_count: Math.max(0, currentLikes - 1) });
        } else {
            transaction.set(likeRef, { created_at: Timestamp.now() });
            transaction.update(routeRef, { likes_count: currentLikes + 1 });
        }
    });

    return !isLiked; // Returns true if liked, false if unliked
};

export const getRouteLikeStatus = async (routeId: string, userId: string): Promise<boolean> => {
    const likeRef = doc(db, 'routes', routeId, 'likes', userId);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
};

// Like System Helpers (Posts)
export const toggleLikePost = async (postId: string, userId: string): Promise<boolean> => {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const postRef = doc(postsCol, postId);
    const likeSnap = await getDoc(likeRef);
    const isLiked = likeSnap.exists();

    await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) throw "Post does not exist!";

        const currentLikes = postDoc.data().likes_count || 0;

        if (isLiked) {
            transaction.delete(likeRef);
            transaction.update(postRef, { likes_count: Math.max(0, currentLikes - 1) });
        } else {
            transaction.set(likeRef, { created_at: Timestamp.now() });
            transaction.update(postRef, { likes_count: currentLikes + 1 });
        }
    });

    return !isLiked;
};

export const getPostLikeStatus = async (postId: string, userId: string): Promise<boolean> => {
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
};

// Save System Helpers
export const toggleSavePost = async (userId: string, postId: string): Promise<boolean> => {
    const userRef = doc(usersCol, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) throw "User does not exist!";

    const userData = userSnap.data() as User;
    const savedPosts = userData.saved_posts || [];
    const isSaved = savedPosts.includes(postId);

    let newSavedPosts;
    if (isSaved) {
        newSavedPosts = savedPosts.filter(id => id !== postId);
    } else {
        newSavedPosts = [...savedPosts, postId];
    }

    await updateDoc(userRef, { saved_posts: newSavedPosts });
    return !isSaved;
};
