/**
 * Todo App Dashboard Logic
 * Persistent WebStorage (localStorage)
 * Plain Vanilla JS with zero innerHTML assignment for maximum security
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'todo_dashboard_tasks_v1';

  // Application State
  let tasks = [];
  let editingTaskId = null;
  let modalConfirmCallback = null;

  // DOM Elements
  const headerDateEl = document.getElementById('header-date');
  const statTotalEl = document.getElementById('stat-total');
  const statActiveEl = document.getElementById('stat-active');
  const statCompletedEl = document.getElementById('stat-completed');
  const statHighEl = document.getElementById('stat-high');
  const progressPercentageEl = document.getElementById('progress-percentage');
  const progressFillEl = document.getElementById('progress-fill');

  const taskForm = document.getElementById('task-form');
  const formHeadingEl = document.getElementById('form-heading');
  const taskIdInput = document.getElementById('task-id');
  const taskTitleInput = document.getElementById('task-title');
  const taskCategorySelect = document.getElementById('task-category');
  const taskPrioritySelect = document.getElementById('task-priority');
  const taskDueDateInput = document.getElementById('task-duedate');
  const taskNotesInput = document.getElementById('task-notes');
  const submitBtn = document.getElementById('submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  const searchInput = document.getElementById('search-input');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterPrioritySelect = document.getElementById('filter-priority');
  const filterCategorySelect = document.getElementById('filter-category');
  const sortBySelect = document.getElementById('sort-by');

  const listCountEl = document.getElementById('list-count');
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  const taskListEl = document.getElementById('task-list');
  const emptyStateEl = document.getElementById('empty-state');
  const emptyMessageEl = document.getElementById('empty-message');

  const confirmModalEl = document.getElementById('confirm-modal');
  const modalTitleEl = document.getElementById('modal-title');
  const modalMessageEl = document.getElementById('modal-message');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  // Initialize Application
  function init() {
    displayHeaderDate();
    loadTasksFromStorage();

    if (tasks.length === 0) {
      tasks = getSeedTasks();
      saveTasksToStorage();
    }

    bindEvents();
    render();
  }

  // Sample Seed Tasks for first-time visitors
  function getSeedTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return [
      {
        id: 'task_' + Date.now() + '_1',
        title: 'Review Project Requirements',
        category: 'Work',
        priority: 'High',
        dueDate: today,
        notes: 'Check all specifications for the upcoming sprint.',
        completed: true,
        createdAt: Date.now() - 3600000
      },
      {
        id: 'task_' + Date.now() + '_2',
        title: 'Weekly Workout & Cardio',
        category: 'Health',
        priority: 'Medium',
        dueDate: tomorrow,
        notes: '30 minutes jogging + core routine.',
        completed: false,
        createdAt: Date.now() - 1800000
      },
      {
        id: 'task_' + Date.now() + '_3',
        title: 'Organize Financial Records',
        category: 'Finance',
        priority: 'Low',
        dueDate: '',
        notes: 'File receipts and check monthly expenses budget.',
        completed: false,
        createdAt: Date.now()
      }
    ];
  }

  function displayHeaderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    headerDateEl.textContent = new Date().toLocaleDateString(undefined, options);
  }

  // Storage Handlers
  function loadTasksFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks = JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Unable to load tasks from localStorage', err);
      tasks = [];
    }
  }

  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn('Unable to save tasks to localStorage', err);
    }
  }

  // Event Listeners
  function bindEvents() {
    taskForm.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', resetForm);

    searchInput.addEventListener('input', render);
    filterStatusSelect.addEventListener('change', render);
    filterPrioritySelect.addEventListener('change', render);
    filterCategorySelect.addEventListener('change', render);
    sortBySelect.addEventListener('change', render);

    clearCompletedBtn.addEventListener('click', handleClearCompleted);

    modalCancelBtn.addEventListener('click', closeModal);
    modalConfirmBtn.addEventListener('click', handleModalConfirm);
    confirmModalEl.addEventListener('click', function (e) {
      if (e.target === confirmModalEl) {
        closeModal();
      }
    });
  }

  // Task Creation & Editing
  function handleFormSubmit(e) {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    if (!title) return;

    const category = taskCategorySelect.value;
    const priority = taskPrioritySelect.value;
    const dueDate = taskDueDateInput.value;
    const notes = taskNotesInput.value.trim();

    if (editingTaskId) {
      // Update Existing Task
      const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].title = title;
        tasks[taskIndex].category = category;
        tasks[taskIndex].priority = priority;
        tasks[taskIndex].dueDate = dueDate;
        tasks[taskIndex].notes = notes;
      }
    } else {
      // Create New Task
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: title,
        category: category,
        priority: priority,
        dueDate: dueDate,
        notes: notes,
        completed: false,
        createdAt: Date.now()
      };
      tasks.unshift(newTask);
    }

    saveTasksToStorage();
    resetForm();
    render();
  }

  function startEditTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = task.id;
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskCategorySelect.value = task.category;
    taskPrioritySelect.value = task.priority;
    taskDueDateInput.value = task.dueDate || '';
    taskNotesInput.value = task.notes || '';

    formHeadingEl.textContent = 'Edit Task';
    submitBtn.textContent = 'Update Task';
    cancelEditBtn.style.display = 'inline-flex';
    taskTitleInput.focus();
  }

  function resetForm() {
    editingTaskId = null;
    taskForm.reset();
    taskIdInput.value = '';
    formHeadingEl.textContent = 'Add New Task';
    submitBtn.textContent = 'Add Task';
    cancelEditBtn.style.display = 'none';
  }

  // Task Actions
  function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = !tasks[taskIndex].completed;
      saveTasksToStorage();
      render();
    }
  }

  function promptDeleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    openModal(
      'Delete Task',
      'Are you sure you want to delete "' + task.title + '"? This action cannot be undone.',
      function () {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasksToStorage();
        if (editingTaskId === taskId) {
          resetForm();
        }
        render();
      }
    );
  }

  function handleClearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;

    openModal(
      'Clear Completed Tasks',
      'Are you sure you want to remove ' + completedCount + ' completed task(s)?',
      function () {
        tasks = tasks.filter(t => !t.completed);
        saveTasksToStorage();
        resetForm();
        render();
      }
    );
  }

  // Modal Handling
  function openModal(title, message, onConfirm) {
    modalTitleEl.textContent = title;
    modalMessageEl.textContent = message;
    modalConfirmCallback = onConfirm;
    confirmModalEl.style.display = 'flex';
  }

  function closeModal() {
    confirmModalEl.style.display = 'none';
    modalConfirmCallback = null;
  }

  function handleModalConfirm() {
    if (modalConfirmCallback) {
      modalConfirmCallback();
    }
    closeModal();
  }

  // Processing & Rendering
  function getFilteredAndSortedTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusFilter = filterStatusSelect.value;
    const priorityFilter = filterPrioritySelect.value;
    const categoryFilter = filterCategorySelect.value;
    const sortBy = sortBySelect.value;

    return tasks.filter(task => {
      // Search text match
      const matchesSearch = !searchTerm ||
        task.title.toLowerCase().includes(searchTerm) ||
        (task.notes && task.notes.toLowerCase().includes(searchTerm));

      // Status match
      let matchesStatus = true;
      if (statusFilter === 'active') matchesStatus = !task.completed;
      if (statusFilter === 'completed') matchesStatus = task.completed;

      // Priority match
      let matchesPriority = true;
      if (priorityFilter !== 'all') matchesPriority = task.priority === priorityFilter;

      // Category match
      let matchesCategory = true;
      if (categoryFilter !== 'all') matchesCategory = task.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'priority') {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      // Default: createdAt descending (newest first)
      return b.createdAt - a.createdAt;
    });
  }

  function updateDashboardStats() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    const highPriority = tasks.filter(t => !t.completed && t.priority === 'High').length;

    statTotalEl.textContent = total.toString();
    statActiveEl.textContent = active.toString();
    statCompletedEl.textContent = completed.toString();
    statHighEl.textContent = highPriority.toString();

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressPercentageEl.textContent = percentage + '%';
    progressFillEl.style.width = percentage + '%';

    clearCompletedBtn.style.display = completed > 0 ? 'inline-block' : 'none';
  }

  function render() {
    updateDashboardStats();

    const visibleTasks = getFilteredAndSortedTasks();
    listCountEl.textContent = 'Showing ' + visibleTasks.length + ' of ' + tasks.length + ' tasks';

    // Clear list safely without innerHTML
    taskListEl.replaceChildren();

    if (visibleTasks.length === 0) {
      emptyStateEl.style.display = 'block';
      if (tasks.length === 0) {
        emptyMessageEl.textContent = 'Your task list is empty. Add a task using the form to get started!';
      } else {
        emptyMessageEl.textContent = 'No tasks match your selected search filters.';
      }
      return;
    }

    emptyStateEl.style.display = 'none';

    visibleTasks.forEach(task => {
      const li = createTaskElement(task);
      taskListEl.appendChild(li);
    });
  }

  // Safe DOM Element Construction (No innerHTML)
  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    // Checkbox Wrapper
    const checkWrapper = document.createElement('div');
    checkWrapper.className = 'task-checkbox-wrapper';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Mark task as complete');
    checkbox.addEventListener('change', function () {
      toggleTaskComplete(task.id);
    });
    checkWrapper.appendChild(checkbox);

    // Task Body
    const body = document.createElement('div');
    body.className = 'task-body';

    // Title Row
    const titleRow = document.createElement('div');
    titleRow.className = 'task-title-row';

    const titleText = document.createElement('span');
    titleText.className = 'task-title-text';
    titleText.textContent = task.title;
    titleRow.appendChild(titleText);

    // Priority Badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = 'badge badge-priority-' + task.priority.toLowerCase();
    priorityBadge.textContent = task.priority;
    titleRow.appendChild(priorityBadge);

    // Category Badge
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'badge badge-category';
    categoryBadge.textContent = task.category;
    titleRow.appendChild(categoryBadge);

    body.appendChild(titleRow);

    // Notes (if available)
    if (task.notes) {
      const notesEl = document.createElement('p');
      notesEl.className = 'task-notes-text';
      notesEl.textContent = task.notes;
      body.appendChild(notesEl);
    }

    // Meta Info Row (Due Date)
    const metaRow = document.createElement('div');
    metaRow.className = 'task-meta';

    if (task.dueDate) {
      const dueSpan = document.createElement('span');
      dueSpan.textContent = '📅 Due: ' + formatDueDate(task.dueDate);
      metaRow.appendChild(dueSpan);
    }

    body.appendChild(metaRow);

    // Action Buttons
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon';
    editBtn.textContent = '✏️ Edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', function () {
      startEditTask(task.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon btn-icon-danger';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', function () {
      promptDeleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    // Assembly
    li.appendChild(checkWrapper);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  function formatDueDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }

  // Start application on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
