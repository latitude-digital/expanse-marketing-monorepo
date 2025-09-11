import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, doc, setDoc, getDoc } from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import db from '../../services/firestore';
import app from '../../services/firebase';
import functions from '../../services/functions';
// Import FontAwesome SVG icons as URLs
import UserIconUrl from '@fontawesome/regular/user.svg';
import UserPlusIconUrl from '@fontawesome/regular/user-plus.svg';
import PencilIconUrl from '@fontawesome/regular/pencil.svg';
import TrashIconUrl from '@fontawesome/regular/trash.svg';
import ShieldCheckIconUrl from '@fontawesome/solid/user-shield.svg';
import TagIconUrl from '@fontawesome/regular/tag.svg';
import KeyIconUrl from '@fontawesome/regular/user-key.svg';
import { FontAwesomeIcon } from '../../components/FontAwesomeIcon';

// Create icon components
const UserIcon = (props: any) => <FontAwesomeIcon src={UserIconUrl} {...props} />;
const UserPlusIcon = (props: any) => <FontAwesomeIcon src={UserPlusIconUrl} {...props} />;
const PencilIcon = (props: any) => <FontAwesomeIcon src={PencilIconUrl} {...props} />;
const TrashIcon = (props: any) => <FontAwesomeIcon src={TrashIconUrl} {...props} />;
const ShieldCheckIcon = (props: any) => <FontAwesomeIcon src={ShieldCheckIconUrl} {...props} />;
const TagIcon = (props: any) => <FontAwesomeIcon src={TagIconUrl} {...props} />;
const KeyIcon = (props: any) => <FontAwesomeIcon src={KeyIconUrl} {...props} />;

interface User {
    uid: string;
    email: string;
    displayName?: string;
    isAdmin?: boolean;
    tags?: string[]; // Array of tag IDs from Firestore
}

interface Tag {
    id: string;
    name: string;
    color: string;
}

// Tag Combobox Component for multiple tag selection
function TagCombobox({ 
    availableTags, 
    selectedTags, 
    onChange 
}: { 
    availableTags: Tag[], 
    selectedTags: string[], 
    onChange: (tags: string[]) => void 
}) {
    const [query, setQuery] = useState('');
    
    // Filter out already selected tags and match query
    const filteredTags = query === ''
        ? availableTags.filter(tag => !selectedTags.includes(tag.id))
        : availableTags.filter(tag => 
            !selectedTags.includes(tag.id) && 
            tag.name.toLowerCase().includes(query.toLowerCase())
        );

    const handleSelect = (tag: Tag | null) => {
        if (tag) {
            onChange([...selectedTags, tag.id]);
            setQuery('');
        }
    };

    const removeTag = (tagId: string) => {
        onChange(selectedTags.filter(t => t !== tagId));
    };

    // Helper function to create a lighter tint of a color for background
    const getLighterTint = (hexColor: string, opacity: number = 0.1): string => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return (
        <div>
            <Combobox value={null} onChange={handleSelect}>
                <div className="relative">
                    <ComboboxInput
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm pr-10"
                        onChange={(event) => setQuery(event.target.value)}
                        onBlur={() => setQuery('')}
                        placeholder="Search and select tags..."
                        displayValue={() => query}
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </ComboboxButton>

                    {filteredTags.length > 0 && (
                        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredTags.map((tag) => (
                                <ComboboxOption
                                    key={tag.id}
                                    value={tag}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                            active ? 'bg-[#257180] text-white' : 'text-gray-900'
                                        }`
                                    }
                                >
                                    <div className="flex items-center">
                                        <span
                                            className="inline-block h-3 w-3 rounded-full mr-2"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="block truncate">{tag.name}</span>
                                    </div>
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    )}
                </div>
            </Combobox>

            {/* Display selected tags - matching modern badge style */}
            {selectedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTags.map((tagId) => {
                        const tag = availableTags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                            <span
                                key={tagId}
                                className="inline-flex items-center gap-x-0.5 rounded-md px-2 py-1 text-xs font-medium"
                                style={{
                                    backgroundColor: getLighterTint(tag.color, 0.1),
                                    color: getContrastTextColor(tag.color),
                                    border: `1px solid ${tag.color}`,
                                }}
                            >
                                {tag.name}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tagId)}
                                    className="group relative -mr-1 size-3.5 rounded-xs"
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = getLighterTint(tag.color, 0.2);
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <span className="sr-only">Remove</span>
                                    <svg
                                        viewBox="0 0 14 14"
                                        className="size-3.5"
                                        style={{
                                            stroke: getContrastTextColor(tag.color),
                                            strokeWidth: 2,
                                        }}
                                    >
                                        <path d="M4 4l6 6m0-6l-6 6" />
                                    </svg>
                                    <span className="absolute -inset-1" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Helper function to create a lighter tint of a color for background
const getLighterTint = (hexColor: string, opacity: number = 0.1): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to ensure WCAG AAA compliance (7:1 contrast ratio)
const getContrastTextColor = (hexColor: string): string => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate relative luminance using WCAG formula
    const getLuminance = (val: number) => {
        const sRGB = val / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };
    
    const colorLuminance = 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b);
    
    // Since we're using a very light tint (0.1 opacity) for background,
    // the background luminance is close to white (approximately 0.9)
    const bgLuminance = 0.9;
    
    // Calculate contrast with the original color
    const colorContrast = bgLuminance > colorLuminance 
        ? (bgLuminance + 0.05) / (colorLuminance + 0.05)
        : (colorLuminance + 0.05) / (bgLuminance + 0.05);
    
    // If original color provides AAA compliance (7:1), use it
    if (colorContrast >= 7) {
        return hexColor;
    }
    
    // Otherwise, determine if black or white provides better contrast
    const blackContrast = (bgLuminance + 0.05) / 0.05;
    const whiteContrast = 1.05 / (bgLuminance + 0.05);
    
    // Use black for AAA compliance (it will always work on light backgrounds)
    return blackContrast >= 7 ? '#000000' : '#FFFFFF';
};

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        email: '',
        displayName: '',
        isAdmin: false,
        tags: []
    });
    const [password, setPassword] = useState('');
    const auth = getAuth(app);

    useEffect(() => {
        loadUsers();
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const tagsQuery = query(
                collection(db, 'tags'),
                orderBy('name', 'asc')
            );
            const snapshot = await getDocs(tagsQuery);
            const tagsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Tag));
            setTags(tagsData);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    const loadUsers = async () => {
        try {
            // Call Cloud Function to list all users from Auth
            const listUsers = httpsCallable(functions, 'listUsers');
            const result = await listUsers();
            const authUsers = (result.data as any).users || [];
            
            // Fetch Firestore metadata for each user
            const usersWithMetadata = await Promise.all(
                authUsers.map(async (authUser: any) => {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            return {
                                ...authUser,
                                email: authUser.email, // Explicitly preserve email from auth
                                tags: userData.tags || [], // Array of tag IDs
                                displayName: userData.displayName || authUser.displayName
                            };
                        }
                    } catch (error) {
                        console.error(`Error fetching metadata for user ${authUser.uid}:`, error);
                    }
                    return authUser;
                })
            );
            
            setUsers(usersWithMetadata);
        } catch (error) {
            console.error('Error loading users:', error);
            // For now, show current user as a fallback
            const currentUser = auth.currentUser;
            if (currentUser) {
                setUsers([{
                    uid: currentUser.uid,
                    email: currentUser.email || '',
                    displayName: currentUser.displayName || '',
                    isAdmin: true
                }]);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
        try {
            // Call a cloud function to update admin status
            const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
            await setAdminClaim({ userId, admin: !currentStatus });
            
            // Update local state
            setUsers(users.map(user => 
                user.uid === userId 
                    ? { ...user, isAdmin: !currentStatus }
                    : user
            ));
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('Failed to update admin status. You may need to deploy a cloud function for this feature.');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            // Call Cloud Function to delete user
            const deleteUser = httpsCallable(functions, 'deleteUser');
            await deleteUser({ userId });
            setUsers(users.filter(u => u.uid !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Cloud Function may not be deployed.');
        }
    };

    const handlePasswordReset = async (email: string) => {
        if (!confirm(`Send password reset email to ${email}?`)) return;
        
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error('Error sending password reset:', error);
            alert('Failed to send password reset email.');
        }
    };

    const handleSaveUser = async () => {
        try {
            if (editingUser) {
                // Update admin status if changed
                if (editingUser.isAdmin !== formData.isAdmin) {
                    const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
                    await setAdminClaim({ 
                        userId: editingUser.uid, 
                        admin: formData.isAdmin 
                    });
                }

                // Update user document in Firestore with tags (as IDs)
                await setDoc(doc(db, 'users', editingUser.uid), {
                    displayName: formData.displayName || '',
                    tags: formData.tags || [], // Store tag IDs directly
                    email: editingUser.email,
                    updatedAt: new Date()
                }, { merge: true });

                await loadUsers();
                setShowForm(false);
                setEditingUser(null);
            } else {
                // Create new user via Cloud Function
                if (!password) {
                    alert('Password is required for new users');
                    return;
                }
                
                // Call Cloud Function to create user
                const createNewUser = httpsCallable(functions, 'createNewUser');
                const result = await createNewUser({
                    email: formData.email!,
                    password: password,
                    displayName: formData.displayName || '',
                    phoneNumber: null // Optional field
                });
                
                // Get the created user ID from the result
                const userId = (result.data as any).uid || (result.data as any).userId;
                
                if (!userId) {
                    throw new Error('Failed to get user ID from Cloud Function response');
                }
                
                // Set admin claim if needed via Cloud Function
                if (formData.isAdmin) {
                    try {
                        const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
                        await setAdminClaim({ userId, admin: true });
                    } catch (error) {
                        console.error('Failed to set admin claim:', error);
                    }
                }
                
                // Create user document in Firestore with tags (as IDs)
                await setDoc(doc(db, 'users', userId), {
                    uid: userId,
                    email: formData.email!,
                    displayName: formData.displayName || '',
                    tags: formData.tags || [], // Store tag IDs directly
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                setUsers([...users, { 
                    uid: userId,
                    email: formData.email!,
                    displayName: formData.displayName,
                    isAdmin: formData.isAdmin,
                    tags: formData.tags || [] // Store tag IDs
                }]);
            }
            
            setShowForm(false);
            setEditingUser(null);
            setFormData({
                email: '',
                displayName: '',
                isAdmin: false,
                tags: []
            });
            setPassword('');
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(error.message || 'Failed to save user');
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.email?.toLowerCase().includes(searchLower) ||
            user.displayName?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading users...</div>;
    }

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage user accounts and permissions
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:space-x-4">
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({
                                email: '',
                                displayName: '',
                                isAdmin: false,
                                tags: []
                            });
                            setPassword('');
                            setShowForm(true);
                        }}
                        className="inline-flex items-center justify-center rounded-md bg-[#257180] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1a4d57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                    >
                        <UserPlusIcon className="h-4 w-4 mr-2" style={{ filter: 'brightness(0) invert(1)' }} />
                        Add User
                    </button>
                    <div className="relative mt-4 sm:mt-0">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm pl-10"
                        />
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="mb-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingUser ? 'Edit User' : 'Create New User'}
                    </h3>
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    disabled={!!editingUser}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                {!!editingUser && (
                                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed after user creation</p>
                                )}
                            </div>
                            {!editingUser && (
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm"
                                        minLength={6}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                                Display Name
                            </label>
                            <input
                                type="text"
                                id="displayName"
                                value={formData.displayName || ''}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <TagCombobox
                                availableTags={tags}
                                selectedTags={formData.tags || []}
                                onChange={(selectedTags) => setFormData({ ...formData, tags: selectedTags })}
                            />
                        </div>

                        <div>
                            <div className="flex items-center">
                                <input
                                    id="isAdmin"
                                    name="isAdmin"
                                    type="checkbox"
                                    checked={formData.isAdmin || false}
                                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-[#257180] focus:ring-[#257180]"
                                />
                                <label htmlFor="isAdmin" className="ml-2 block text-sm font-medium text-gray-700">
                                    Administrator privileges
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Administrators can access the admin panel and manage users, events, and surveys
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingUser(null);
                                    setFormData({
                                        email: '',
                                        displayName: '',
                                        isAdmin: false,
                                        tags: []
                                    });
                                    setPassword('');
                                }}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-[#257180] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1a4d57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                            >
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    Email
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Display Name
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Tags
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredUsers.map((user) => (
                                <tr key={user.uid}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        <div className="flex items-center gap-2">
                                            {user.email}
                                            {user.isAdmin && (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {user.displayName || '-'}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-500">
                                        <div className="flex flex-wrap gap-1">
                                            {user.tags?.map(tagId => {
                                                const tag = tags.find(t => t.id === tagId);
                                                if (!tag) return null;
                                                return (
                                                    <span
                                                        key={tagId}
                                                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                                                        style={{
                                                            backgroundColor: getLighterTint(tag.color, 0.1),
                                                            color: getContrastTextColor(tag.color),
                                                            border: `1px solid ${tag.color}`,
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                );
                                            })}
                                            {(!user.tags || user.tags.length === 0) && (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex gap-1 justify-end">
                                            <button
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    // Tags are already stored as IDs in Firestore
                                                    setFormData({
                                                        email: user.email,
                                                        displayName: user.displayName,
                                                        isAdmin: user.isAdmin,
                                                        tags: user.tags || [] // Already IDs
                                                    });
                                                    setPassword('');
                                                    setShowForm(true);
                                                }}
                                                className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                style={{ width: '36px', height: '36px' }}
                                                title="Edit user"
                                            >
                                                <PencilIcon className="h-4 w-4 filter brightness-0 invert" />
                                            </button>
                                            <button
                                                onClick={() => handlePasswordReset(user.email)}
                                                className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                style={{ width: '36px', height: '36px' }}
                                                title="Send password reset email"
                                            >
                                                <KeyIcon className="h-4 w-4 filter brightness-0 invert" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.uid)}
                                                className="bg-red-600 hover:bg-red-800 text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                style={{ width: '36px', height: '36px' }}
                                                title="Delete user"
                                            >
                                                <TrashIcon className="h-4 w-4 filter brightness-0 invert" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-500">
                                {searchTerm ? 'No users found matching your search.' : 'No users yet.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
