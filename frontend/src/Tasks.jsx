import { useMemo, useState } from 'react';

const API_URL = 'http://127.0.0.1:8000/api';

const initialForm = {
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    status: 'to_do',
    due_date: '',
};

function Tasks({
    tasks,
    setTasks,
    categories,
    setCategories,
    loading,
    error,
}) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState(initialForm);

    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch = (task.title || '')
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesCategory =
                categoryFilter === 'all' ||
                String(task.category_id ?? '') === categoryFilter;

            const matchesPriority =
                priorityFilter === 'all' || task.priority === priorityFilter;

            const matchesStatus =
                statusFilter === 'all' || task.status === statusFilter;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesPriority &&
                matchesStatus
            );
        });
    }, [
        tasks,
        search,
        categoryFilter,
        priorityFilter,
        statusFilter,
    ]);

    function formatStatus(status) {
        const labels = {
            to_do: 'To Do',
            in_progress: 'In Progress',
            completed: 'Completed',
        };

        return labels[status] || status;
    }

    function formatDate(date) {
        if (!date) return 'No due date';

        const [year, month, day] = date.slice(0, 10).split('-');

        const localDate = new Date(
            Number(year),  Number(month) - 1, Number(day)
        );

        return localDate.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    }

    function openAddForm() {
        setEditingTask(null);
        setFormData({ ...initialForm });
        setFormError('');
        setShowForm(true);
    }

    function openEditForm(task) {
        setEditingTask(task);

        setFormData({
            title: task.title || '',
            description: task.description || '',
            category_id: task.category_id != null ? String(task.category_id): '',
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? task.due_date.slice(0, 10): '',
        });

        setFormError('');
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingTask(null);
        setFormData({ ...initialForm });
        setFormError('');
    }

    function updateCategoryCounts(oldCategoryId, newCategoryId) {
        if (String(oldCategoryId ?? '') === String(newCategoryId ?? '')) {
            return;
        }

        setCategories((previousCategories) =>
            previousCategories.map((category) => {
                if (String(category.id) === String(oldCategoryId)) {
                    return {
                        ...category,
                        tasks_count: Math.max(
                            0,
                            Number(category.tasks_count || 0) - 1
                        ),
                    };
                }

                if (String(category.id) === String(newCategoryId)) {
                    return {
                        ...category,
                        tasks_count: Number(category.tasks_count || 0) + 1,
                    };
                }

                return category;
            })
        );
    }

    // Mengirim data task ke backend untuk proses Create atau Update
    async function handleSaveTask(event) {
        event.preventDefault();

        setSaving(true);
        setFormError('');

        const isEditing = Boolean(editingTask);

        try {
            const response = await fetch(isEditing ? `${API_URL}/tasks/${editingTask.id}` : `${API_URL}/tasks`,
                {
                    method: isEditing ? 'PUT' : 'POST',
                    headers: {'Content-Type': 'application/json', Accept: 'application/json',},
                    body: JSON.stringify({
                        ...formData,
                        category_id: formData.category_id || null,
                        due_date: formData.due_date || null,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                const message = result.errors
                    ? Object.values(result.errors).flat().join(' ')
                    : result.message || 'Failed to save task.';

                throw new Error(message);
            }

            const savedTask = result.data;

            const selectedCategory = categories.find(
                (category) => String(category.id) === String(savedTask.category_id)
            );

            const taskWithCategory = {
                ...savedTask,
                category: selectedCategory || null,
            };

            if (isEditing) {
                setTasks((previousTasks) =>
                    previousTasks.map((task) =>
                        String(task.id) === String(editingTask.id)
                            ? taskWithCategory
                            : task
                    )
                );

                updateCategoryCounts(
                    editingTask.category_id,
                    savedTask.category_id
                );
            } else {
                setTasks((previousTasks) => [
                    taskWithCategory,
                    ...previousTasks,
                ]);

                if (selectedCategory) {
                    setCategories((previousCategories) =>
                        previousCategories.map((category) =>
                            String(category.id) === String(selectedCategory.id)
                                ? {
                                    ...category,
                                    tasks_count: Number(category.tasks_count || 0) + 1,
                                }
                                : category
                        )
                    );
                }
            }

            setShowForm(false);
            setEditingTask(null);
            setFormData({ ...initialForm });
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    }

    // Menghapus task yang dipilih user
    async function handleDeleteTask(task) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${task.title}"?`
        );

        if (!confirmed) return;

        try {
            // Mengirim request DELETE ke API berdasarkan ID task
            const response = await fetch(`${API_URL}/tasks/${task.id}`,
                {method: 'DELETE',
                headers: {Accept: 'application/json',},
                }
            );

            if (!response.ok) {
                const result = await response.json();

                throw new Error(
                    result.message || 'Failed to delete task.'
                );
            }

            setTasks((previousTasks) =>
                previousTasks.filter((item) => String(item.id) !== String(task.id))
            );

            updateCategoryCounts(task.category_id, null);
        } catch (err) {
            window.alert(err.message);
        }
    }

    function renderTaskTable() {
        if (loading) {
            return <p className="message">Loading tasks...</p>;
        }

        if (error) {
            return <p className="error-message">{error}</p>;
        }

        if (filteredTasks.length === 0) {
            return (
                <div className="empty-state">
                    <h3>No tasks found</h3>
                    <p>Try another search or filter</p>
                </div>
            );
        }

        return (
            <div className="table-wrapper">
                <table className="tasks-table">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTasks.map((task) => (
                            <tr key={task.id}>
                                <td className="table-task-title">
                                    {task.title}
                                </td>

                                <td>
                                    {task.category?.name || 'Uncategorized'}
                                </td>

                                <td>
                                    <span className={`priority-tag ${task.priority}`}>
                                        {task.priority}
                                    </span>
                                </td>

                                <td>
                                    <span className={`status-tag ${task.status}`}>
                                        {formatStatus(task.status)}
                                    </span>
                                </td>

                                <td>{formatDate(task.due_date)}</td>

                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="edit-button"
                                            onClick={() => openEditForm(task)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="delete-button"
                                            onClick={() => handleDeleteTask(task)}
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
        );
    }

    // Form modal digunakan untuk proses Add dan Edit
    function renderTaskForm() {
        return (
            <div className="modal-overlay">
                <div className="task-modal">
                    <div className="modal-header">
                        <h2>
                            {editingTask ? 'Edit Task' : 'Add New Task'}
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

                    <form onSubmit={handleSaveTask}>
                        <div className="form-group">
                            <label>Task Title</label>
                            <input
                                type="text"
                                placeholder="Enter task title"
                                value={formData.title}
                                onChange={(event) =>
                                    setFormData({
                                        ...formData,
                                        title: event.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                placeholder="Enter task description"
                                value={formData.description}
                                onChange={(event) =>
                                    setFormData({
                                        ...formData,
                                        description: event.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            category_id: event.target.value,
                                        })
                                    }
                                >
                                    <option value="">Uncategorized</option>

                                    {categories.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            priority: event.target.value,
                                        })
                                    }
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            status: event.target.value,
                                        })
                                    }
                                >
                                    <option value="to_do">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            due_date: event.target.value,
                                        })
                                    }
                                />
                            </div>
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
                                    : editingTask
                                        ? 'Save Changes'
                                        : 'Add Task'}
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
                <div className="my-tasks-toolbar">
                    <input
                        type="search"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <select
                        value={categoryFilter}
                        onChange={(event) =>
                            setCategoryFilter(event.target.value)
                        }
                    >
                        <option value="all">All Categories</option>

                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={String(category.id)}
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(event) =>
                            setPriorityFilter(event.target.value)
                        }
                    >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                    >
                        <option value="all">All Status</option>
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <button
                    className="add-task-button"
                    onClick={openAddForm}
                >
                    + Add Task
                </button>
            </div>

            {renderTaskTable()}

            {showForm && renderTaskForm()}
        </section>
    );
}

export default Tasks;
