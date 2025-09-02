import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../services/firebase';
// Import FontAwesome SVG icons as URLs
import UserIconUrl from '@fontawesome/regular/user.svg';
import ShieldCheckIconUrl from '@fontawesome/solid/user-shield.svg';
import { FontAwesomeIcon } from '../../components/FontAwesomeIcon';

// Create icon components
const UserIcon = (props: any) => <FontAwesomeIcon src={UserIconUrl} {...props} />;
const ShieldCheckIcon = (props: any) => <FontAwesomeIcon src={ShieldCheckIconUrl} {...props} />;

interface User {
    id: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    isAdmin?: boolean;
    createdAt?: Date;
    lastLogin?: Date;
    eventAccess?: string[];
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const functions = getFunctions(app);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            // Call Firebase function to get users from Firebase Auth
            const getUsersList = httpsCallable(functions, `${import.meta.env.VITE_FIREBASE_NAMESPACE || 'staging'}-getUsersList`);
            const result = await getUsersList();
            const data = result.data as any;
            
            if (data.success) {
                setUsers(data.users);
            } else {
                console.error('Failed to load users');
            }
        } catch (error) {
            console.error('Error loading users:', error);
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
                user.id === userId 
                    ? { ...user, isAdmin: !currentStatus }
                    : user
            ));
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('Failed to update admin status. You may need to deploy a cloud function for this feature.');
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.email?.toLowerCase().includes(searchLower) ||
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.company?.toLowerCase().includes(searchLower)
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
                <div className="mt-4 sm:mt-0">
                    <div className="relative">
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

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    User
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Email
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Company
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Phone
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Admin
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-[#257180] flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="font-medium text-gray-900">
                                                    {user.firstName && user.lastName
                                                        ? `${user.firstName} ${user.lastName}`
                                                        : user.displayName || 'No name'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {user.company || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {user.phone || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {user.isAdmin ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                User
                                            </span>
                                        )}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <button
                                            onClick={() => toggleAdminStatus(user.id, user.isAdmin || false)}
                                            className="text-[#257180] hover:text-[#1a4d57]"
                                        >
                                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                        </button>
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