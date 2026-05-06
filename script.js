class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.currentEditingId = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.updateDate();
        this.render();
        setInterval(() => this.updateDate(), 60000);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = e.currentTarget.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Categories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setCategory(btn.dataset.category);
            });
        });

        // Add task button
        document.getElementById('btnAdd').addEventListener('click', () => {
            this.showTaskInput();
        });

        // Cancel task input
        document.getElementById('btnCancelTask').addEventListener('click', () => {
            this.hideTaskInput();
        });

        // Save task
        document.getElementById('btnSaveTask').addEventListener('click', () => {
            this.saveTask();
        });

        // Allow Enter key to save
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveTask();
            }
        });

        // Modal close buttons
        document.querySelector('.btn-close').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('btnCancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('btnSaveEdit').addEventListener('click', () => {
            this.saveEditTask();
        });

        // Allow Enter in modal to save
        document.getElementById('editTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEditTask();
            }
        });

        // Close modal on outside click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.filter === filter);
        });
        this.updatePageTitle();
        this.render();
    }

    setCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        this.render();
    }

    showTaskInput() {
        document.getElementById('taskInputSection').style.display = 'block';
        document.getElementById('taskInput').focus();
        document.getElementById('taskInput').value = '';
    }

    hideTaskInput() {
        document.getElementById('taskInputSection').style.display = 'none';
        document.getElementById('taskInput').value = '';
    }

    saveTask() {
        const text = document.getElementById('taskInput').value.trim();
        const category = document.getElementById('categorySelect').value;
        const priority = document.getElementById('prioritySelect').value;

        if (!text) {
            alert('Veuillez décrire votre tâche');
            return;
        }

        const task = {
            id: Date.now(),
            text,
            category,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.hideTaskInput();
        this.render();

        // Show success feedback
        this.showNotification('Tâche créée avec succès!');
    }

    deleteTask(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
            this.showNotification('Tâche supprimée');
        }
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    openEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.currentEditingId = id;
        document.getElementById('editTaskInput').value = task.text;
        document.getElementById('editCategorySelect').value = task.category;
        document.getElementById('editPrioritySelect').value = task.priority;
        document.getElementById('editModal').style.display = 'flex';
        document.getElementById('editTaskInput').focus();
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditingId = null;
    }

    saveEditTask() {
        if (this.currentEditingId === null) return;

        const task = this.tasks.find(t => t.id === this.currentEditingId);
        if (!task) return;

        const text = document.getElementById('editTaskInput').value.trim();
        if (!text) {
            alert('Veuillez décrire votre tâche');
            return;
        }

        task.text = text;
        task.category = document.getElementById('editCategorySelect').value;
        task.priority = document.getElementById('editPrioritySelect').value;

        this.saveTasks();
        this.closeEditModal();
        this.render();
        this.showNotification('Tâche mise à jour');
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            case 'important':
                filtered = filtered.filter(t => t.priority === 'high' && !t.completed);
                break;
        }

        // Apply category
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(t => t.category === this.currentCategory);
        }

        return filtered;
    }

    render() {
        const filtered = this.getFilteredTasks();
        const tasksList = document.getElementById('tasksList');

        if (filtered.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="38" stroke="#e5e7eb" stroke-width="2"/>
                        <path d="M30 40L37 47L50 34" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3>Aucune tâche</h3>
                    <p>Créez une nouvelle tâche pour commencer</p>
                </div>
            `;
        } else {
            tasksList.innerHTML = filtered.map(task => this.createTaskElement(task)).join('');
            this.attachTaskEventListeners();
        }

        this.updateStats();
    }

    createTaskElement(task) {
        const priorityLabel = {
            low: 'Basse',
            medium: 'Moyenne',
            high: 'Haute'
        };

        const categoryEmoji = {
            travail: '💼',
            personnel: '👤',
            sante: '🏥',
            apprentissage: '📚'
        };

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} priority-${task.priority}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    data-id="${task.id}"
                >
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-text">${this.escapeHtml(task.text)}</span>
                        <span class="task-category ${task.category}">
                            ${categoryEmoji[task.category]} ${task.category}
                        </span>
                    </div>
                    <div class="task-footer">
                        <span class="task-priority ${task.priority}">
                            ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                            ${priorityLabel[task.priority]}
                        </span>
                        <span>${this.formatDate(task.createdAt)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-edit" data-id="${task.id}" title="Éditer">✏️</button>
                    <button class="btn-delete" data-id="${task.id}" title="Supprimer">🗑️</button>
                </div>
            </div>
        `;
    }

    attachTaskEventListeners() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleComplete(parseInt(checkbox.dataset.id));
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openEditModal(parseInt(btn.dataset.id));
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteTask(parseInt(btn.dataset.id));
            });
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = this.tasks.filter(t => !t.completed).length;
        const highPriority = this.tasks.filter(t => t.priority === 'high' && !t.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('activeTasks').textContent = active;
        document.getElementById('completionRate').textContent = completionRate + '%';
        document.getElementById('highPriorityCount').textContent = highPriority;
    }

    updatePageTitle() {
        const titles = {
            all: 'Toutes les tâches',
            active: 'Tâches en cours',
            completed: 'Tâches complétées',
            important: 'Tâches importantes'
        };
        document.getElementById('pageTitle').textContent = titles[this.currentFilter];
    }

    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date().toLocaleDateString('fr-FR', options);
        document.getElementById('currentDate').textContent = date;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    showNotification(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 2000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
