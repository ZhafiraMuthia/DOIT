import { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000/api';

function Categories({
    setTasks,
    categories,
    setCategories,
    loading,
    error,
}) {
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    function openAddForm() {
        setEditingCategory(null);
        setCategoryName('');
        setFormError('');
        setShowForm(true);
    }

    function openEditForm(category) {
        setEditingCategory(category);
        setCategoryName(category.name);
        setFormError('');
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingCategory(null);
        setCategoryName('');
        setFormError('');
    }

    // Mengirim category ke backend untuk proses Create atau Update
    async function handleSaveCategory(event) {
        event.preventDefault();

        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            setFormError('Category name is required.');
            return;
        }

        setSaving(true);
        setFormError('');

        const isEditing = Boolean(editingCategory);

        try {
            const response = await fetch(isEditing ? `${API_URL}/categories/${editingCategory.id}` : `${API_URL}/categories`,
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {'Content-Type': 'application/json', Accept: 'application/json',},
                    body: JSON.stringify({
                        name: trimmedName,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                const message = result.errors
                    ? Object.values(result.errors).flat().join(' ')
                    : result.message || 'Failed to save category.';

                throw new Error(message);
            }

            const savedCategory = {
                ...result.data,
                tasks_count: isEditing
                    ? Number(editingCategory.tasks_count || 0)
                    : 0,
            };

            if (isEditing) {
                setCategories((previousCategories) =>
                    previousCategories.map((category) =>
                        String(category.id) === String(editingCategory.id)
                            ? savedCategory
                            : category
                    )
                );

                setTasks((previousTasks) =>
                    previousTasks.map((task) =>
                        String(task.category_id) === String(editingCategory.id)
                            ? {
                                ...task,
                                category: savedCategory,
                            }
                            : task
                    )
                );
            } else {
                setCategories((previousCategories) => [
                    ...previousCategories,
                    savedCategory,
                ]);
            }

            setShowForm(false);
            setEditingCategory(null);
            setCategoryName('');
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // Menghapus kategori tanpa menghapus task yang terhubung dengannya
    async function handleDeleteCategory(category) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${category.name}"?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${API_URL}/categories/${category.id}`,
                {method: 'DELETE',
                headers: {Accept: 'application/json',},
                }
            );

            if (!response.ok) {
                const result = await response.json();

                throw new Error(
                    result.message || 'Failed to delete category.'
                );
            }

            setCategories((previousCategories) =>
                previousCategories.filter(
                    (item) => String(item.id) !== String(category.id)
                )
            );

            setTasks((previousTasks) =>
                previousTasks.map((task) =>
                    String(task.category_id) === String(category.id)
                        ? {
                            ...task,
                            category_id: null,
                            category: null,
                        }
                        : task
                )
            );
        } catch (err) {
            window.alert(err.message);
        }
    }

    function renderCategoryForm() {
        return (
            <div className="modal-overlay">
                <div className="task-modal category-modal">
                    <div className="modal-header">
                        <h2>
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </h2>

                        <button
                            type="button"
                            className="modal-close"
                            onClick={closeForm}
                            disabled={saving}
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSaveCategory}>
                        <div className="form-group">
                            <label>Category Name</label>

                            <input
                                type="text"
                                placeholder="Enter category name"
                                value={categoryName}
                                onChange={(event) =>
                                    setCategoryName(event.target.value)
                                }
                                required
                            />
                        </div>

                        {formError && (
                            <p className="error-message">{formError}</p>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={closeForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingCategory
                                        ? 'Save Changes'
                                        : 'Add Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <section className="my-tasks-panel">
            <div className="my-tasks-header">
                <button
                    className="add-task-button"
                    onClick={openAddForm}
                >
                    + Add Category
                </button>
            </div>

            {loading ? (
                <p className="message">Loading categories...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : categories.length === 0 ? (
                <div className="empty-state">
                    <h3>No categories yet</h3>
                    <p>Create a category to organize your tasks</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="tasks-table categories-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td className="table-task-title">
                                        {category.name}
                                    </td>

                                    <td>
                                        <div className="table-actions">
                                            <button
                                                className="edit-button"
                                                onClick={() => openEditForm(category)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="delete-button"
                                                onClick={() => handleDeleteCategory(category)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && renderCategoryForm()}
        </section>
    );
}

export default Categories;
