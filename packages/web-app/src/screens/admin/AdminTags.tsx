import { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore";
import db from '../../services/firestore';
// Import FontAwesome SVG icons as URLs
import TagIconUrl from '@fontawesome/regular/tag.svg';
import PencilIconUrl from '@fontawesome/regular/pencil.svg';
import TrashIconUrl from '@fontawesome/regular/trash.svg';
import { FontAwesomeIcon } from '../../components/FontAwesomeIcon';

// Create icon components
const TagIcon = (props: any) => <FontAwesomeIcon src={TagIconUrl} {...props} />;
const PencilIcon = (props: any) => <FontAwesomeIcon src={PencilIconUrl} {...props} />;
const TrashIcon = (props: any) => <FontAwesomeIcon src={TrashIconUrl} {...props} />;

interface Tag {
    id?: string;
    name: string;
    color: string;
    description?: string;
    createdAt?: Date;
}

export default function AdminTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [formData, setFormData] = useState<Tag>({
        name: '',
        color: '#257180',
        description: ''
    });

    useEffect(() => {
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
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTag?.id) {
                // Update existing tag
                await updateDoc(doc(db, 'tags', editingTag.id), {
                    name: formData.name,
                    color: formData.color,
                    description: formData.description
                });
            } else {
                // Create new tag
                await addDoc(collection(db, 'tags'), {
                    ...formData,
                    createdAt: new Date()
                });
            }
            await loadTags();
            resetForm();
        } catch (error) {
            console.error('Error saving tag:', error);
        }
    };

    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            color: tag.color,
            description: tag.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (tagId: string) => {
        if (window.confirm('Are you sure you want to delete this tag?')) {
            try {
                await deleteDoc(doc(db, 'tags', tagId));
                await loadTags();
            } catch (error) {
                console.error('Error deleting tag:', error);
            }
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingTag(null);
        setFormData({
            name: '',
            color: '#257180',
            description: ''
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading tags...</div>;
    }

    return (
        <div>
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage tags for categorizing events and surveys
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center justify-center rounded-md bg-[#257180] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1a4d57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                    >
                        <TagIcon className="h-4 w-4 mr-2" style={{ filter: 'brightness(0) invert(1)' }} />
                        Add Tag
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingTag ? 'Edit Tag' : 'Create New Tag'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                                Color
                            </label>
                            <div className="mt-1 flex items-center space-x-3">
                                <input
                                    type="color"
                                    id="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="h-10 w-20"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#257180] focus:ring-[#257180] sm:text-sm"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-[#257180] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1a4d57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                            >
                                {editingTag ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div className="px-4 py-5 sm:p-6">
                    {tags.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-500">No tags yet. Create your first tag to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {tags.map((tag) => (
                                <div
                                    key={tag.id}
                                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            <h3 className="text-lg font-medium text-gray-900">{tag.name}</h3>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(tag)}
                                                className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                style={{ width: '36px', height: '36px' }}
                                                title="Edit tag"
                                            >
                                                <PencilIcon className="h-4 w-4 filter brightness-0 invert" />
                                            </button>
                                            <button
                                                onClick={() => tag.id && handleDelete(tag.id)}
                                                className="bg-red-600 hover:bg-red-800 text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                style={{ width: '36px', height: '36px' }}
                                                title="Delete tag"
                                            >
                                                <TrashIcon className="h-4 w-4 filter brightness-0 invert" />
                                            </button>
                                        </div>
                                    </div>
                                    {tag.description && (
                                        <p className="text-sm text-gray-500">{tag.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}