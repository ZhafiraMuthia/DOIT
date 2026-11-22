import { useEffect, useMemo, useState } from 'react';
import './App.css';

import Tasks from './Tasks';
import Categories from './Categories';

const API_URL = 'http://127.0.0.1:8000/api';

function App() {
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activePage, setActivePage] = useState('dashboard');
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        async function fetchData() {
            try {
                const [taskResponse, categoryResponse] = await Promise.all([
                    fetch(`${API_URL}/tasks`),
                    fetch(`${API_URL}/categories`),
                ]);

                if (!taskResponse.ok || !categoryResponse.ok) {
                    throw new Error('Failed to load dashboard data.');
                }

                const taskResult = await taskResponse.json();
                const categoryResult = await categoryResponse.json();

                setTasks(taskResult.data);
                setCategories(categoryResult.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const stats = useMemo(() => {
        return tasks.reduce(
            (result, task) => {
                result.total += 1;

                if (task.status === 'to_do') {
                    result.toDo += 1;
                } else if (task.status === 'in_progress') {
                    result.inProgress += 1;
                } else if (task.status === 'completed') {
                    result.completed += 1;
                }

                return result;
            },
            {
                total: 0,
                toDo: 0,
                inProgress: 0,
                completed: 0,
            }
        );
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesSearch = (task.title || '')
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesStatus =
                activeFilter === 'all' || task.status === activeFilter;

            return matchesSearch && matchesStatus;
        });
    }, [tasks, search, activeFilter]);

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

    const pageTitles = {
        dashboard: 'Dashboard',
        tasks: 'My Tasks',
        categories: 'Categories',
    };

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="brand">
                    <span>DOIT</span>
                </div>

                <div className="sidebar-section">
                    <button
                        className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActivePage('dashboard')}
                    >
                        Dashboard
                    </button>

                    <button
                        className={`nav-item ${activePage === 'tasks' ? 'active' : ''}`}
                        onClick={() => setActivePage('tasks')}
                    >
                        My Tasks
                    </button>

                    <button
                        className={`nav-item ${activePage === 'categories' ? 'active' : ''}`}
                        onClick={() => setActivePage('categories')}
                    >
                        Categories
                    </button>
                </div>

                <div className="sidebar-bottom">
                    <p className="sidebar-footer">DOIT · Task Management</p>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <h1>{pageTitles[activePage]}</h1>
                </header>

                {activePage === 'dashboard' && (
                    <>
                        <section className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-heading">Total Tasks</div>
                                <strong>{stats.total}</strong>
                            </div>

                            <div className="stat-card">
                                <div className="stat-heading">To Do</div>
                                <strong>{stats.toDo}</strong>
                            </div>

                            <div className="stat-card">
                                <div className="stat-heading">In Progress</div>
                                <strong>{stats.inProgress}</strong>
                            </div>

                            <div className="stat-card">
                                <div className="stat-heading">Completed</div>
                                <strong>{stats.completed}</strong>
                            </div>
                        </section>

                        <section className="content-grid">
                            <div className="tasks-panel">
                                <div className="section-heading">
                                    <div>
                                        <h2>My Tasks</h2>
                                    </div>
                                </div>

                                <div className="task-toolbar">
                                    <input
                                        type="search"
                                        placeholder="Search tasks..."
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                    />

                                    <select
                                        value={activeFilter}
                                        onChange={(event) =>
                                            setActiveFilter(event.target.value)
                                        }
                                    >
                                        <option value="all">All Status</option>
                                        <option value="to_do">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                {loading && (
                                    <p className="message">Loading tasks...</p>
                                )}

                                {error && (
                                    <p className="error-message">{error}</p>
                                )}

                                {!loading && !error && (
                                    <div className="task-list">
                                        {filteredTasks.length === 0 ? (
                                            <div className="empty-state">
                                                <h3>No tasks found</h3>
                                                <p>Try another search or filter</p>
                                            </div>
                                        ) : (
                                            filteredTasks.map((task) => (
                                                <article
                                                    className="task-card"
                                                    key={task.id}
                                                >
                                                    <div className="task-main">
                                                        <div
                                                            className={`task-dot ${task.status}`}
                                                        />

                                                        <div>
                                                            <h3>{task.title}</h3>
                                                            <p>
                                                                {task.description || 'No description'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="task-meta">
                                                        <span className="category-tag">
                                                            {task.category?.name || 'Uncategorized'}
                                                        </span>

                                                        <span className={`priority-tag ${task.priority}`}>
                                                            {task.priority}
                                                        </span>

                                                        <span className={`status-tag ${task.status}`}>
                                                            {formatStatus(task.status)}
                                                        </span>

                                                        <span className="due-date">
                                                            {formatDate(task.due_date)}
                                                        </span>
                                                    </div>
                                                </article>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <aside className="categories-panel">
                                <div className="section-heading">
                                    <div>
                                        <h2>Categories</h2>
                                    </div>
                                </div>

                                {loading ? (
                                    <p className="message">Loading...</p>
                                ) : error ? (
                                    <p className="error-message">{error}</p>
                                ) : categories.length === 0 ? (
                                    <p className="message">No categories yet</p>
                                ) : (
                                    <div className="category-list">
                                        {categories.map((category) => (
                                            <div
                                                className="category-item"
                                                key={category.id}
                                            >
                                                <div className="category-symbol">◇</div>

                                                <div>
                                                    <strong>{category.name}</strong>
                                                    <span>
                                                        {category.tasks_count || 0} tasks
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </aside>
                        </section>
                    </>
                )}

                {activePage === 'tasks' && (
                    <Tasks
                        tasks={tasks}
                        setTasks={setTasks}
                        categories={categories}
                        setCategories={setCategories}
                        loading={loading}
                        error={error}
                    />
                )}

                {activePage === 'categories' && (
                    <Categories
                        setTasks={setTasks}
                        categories={categories}
                        setCategories={setCategories}
                        loading={loading}
                        error={error}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
