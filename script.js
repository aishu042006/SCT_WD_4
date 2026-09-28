/* ==========================================================================
   TASKFLOW - SIMPLE, CUTE, CLEAN & PROFESSIONAL TO-DO APP JS
   SkillCraft Technology Task 04
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. CONSTANTS & STATE
    // ----------------------------------------------------------------------
    const STORAGE_KEY = 'taskflow_tasks';
    const THEME_STORAGE_KEY = 'taskflow_theme';

    let tasks = [];
    let activeFilter = 'all';
    let editingTaskId = null;
    let deletingTaskId = null;

    const themeNames = {
        pink: 'Pink Theme',
        purple: 'Purple Theme',
        blue: 'Blue Theme',
        sage: 'Sage Theme',
        peach: 'Peach Theme'
    };

    // Focus Timer State (25 Minutes)
    let timerState = {
        remainingSeconds: 25 * 60,
        intervalId: null,
        isRunning: false
    };

    // ----------------------------------------------------------------------
    // 2. DOM ELEMENTS
    // ----------------------------------------------------------------------
    // Theme Elements
    const themeDots = document.querySelectorAll('.theme-dot');
    const currentThemeName = document.getElementById('currentThemeName');

    // Add Task Form Elements
    const addTaskForm = document.getElementById('addTaskForm');
    const taskTitleInput = document.getElementById('taskTitleInput');
    const taskDateInput = document.getElementById('taskDateInput');
    const taskTimeInput = document.getElementById('taskTimeInput');
    const validationMsg = document.getElementById('validationMsg');

    // Toolbar & Counts
    const totalCount = document.getElementById('totalCount');
    const completedCount = document.getElementById('completedCount');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskListContainer = document.getElementById('taskListContainer');

    // Edit Modal
    const editModal = document.getElementById('editModal');
    const editTaskForm = document.getElementById('editTaskForm');
    const editTitleInput = document.getElementById('editTitleInput');
    const editDateInput = document.getElementById('editDateInput');
    const editTimeInput = document.getElementById('editTimeInput');
    const editValidationMsg = document.getElementById('editValidationMsg');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // Delete Modal
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Timer Elements
    const timerDisplay = document.getElementById('timerDisplay');
    const timerStatus = document.getElementById('timerStatus');
    const startTimerBtn = document.getElementById('startTimerBtn');
    const pauseTimerBtn = document.getElementById('pauseTimerBtn');
    const resetTimerBtn = document.getElementById('resetTimerBtn');

    // ----------------------------------------------------------------------
    // 3. INITIALIZATION & PERSISTENCE
    // ----------------------------------------------------------------------
    function init() {
        loadTheme();
        loadTasks();
        setDefaultInputs();
        setupEventListeners();
        renderTasks();
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'pink';
        setTheme(savedTheme);
    }

    function setTheme(themeKey) {
        if (!themeNames[themeKey]) themeKey = 'pink';
        document.documentElement.setAttribute('data-theme', themeKey);
        localStorage.setItem(THEME_STORAGE_KEY, themeKey);

        themeDots.forEach(dot => {
            const isMatch = dot.getAttribute('data-theme-select') === themeKey;
            dot.classList.toggle('active', isMatch);
        });

        if (currentThemeName) {
            currentThemeName.textContent = themeNames[themeKey];
        }
    }

    function loadTasks() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                tasks = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load tasks:', e);
                tasks = [];
            }
        } else {
            // Absolutely NO fake/demo tasks on first launch
            tasks = [];
        }
    }

    function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        updateCounts();
    }

    function setDefaultInputs() {
        // Set default date to today & current time rounded
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        taskDateInput.value = `${year}-${month}-${day}`;

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        taskTimeInput.value = `${hours}:${minutes}`;
    }

    // ----------------------------------------------------------------------
    // 4. EVENT LISTENERS
    // ----------------------------------------------------------------------
    function setupEventListeners() {
        // Theme Dots Click Listener
        themeDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const selectedTheme = dot.getAttribute('data-theme-select');
                setTheme(selectedTheme);
            });
        });

        // Add Task Form Submit
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addTask();
        });

        // Filter Buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                activeFilter = btn.getAttribute('data-filter');
                renderTasks();
            });
        });

        // Edit Modal Submit & Close
        editTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditTask();
        });
        closeEditModalBtn.addEventListener('click', closeEditModal);
        cancelEditBtn.addEventListener('click', closeEditModal);

        // Delete Modal Submit & Close
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        confirmDeleteBtn.addEventListener('click', confirmDeleteTask);

        // Timer Controls
        startTimerBtn.addEventListener('click', startTimer);
        pauseTimerBtn.addEventListener('click', pauseTimer);
        resetTimerBtn.addEventListener('click', resetTimer);

        // Backdrop Click & Escape Key
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeEditModal();
                closeDeleteModal();
            }
        });
    }

    // ----------------------------------------------------------------------
    // 5. TASK OPERATIONS
    // ----------------------------------------------------------------------
    function addTask() {
        const title = taskTitleInput.value.trim();
        const date = taskDateInput.value;
        const time = taskTimeInput.value;

        // Validation
        if (!title || !date || !time) {
            validationMsg.style.display = 'block';
            return;
        }

        validationMsg.style.display = 'none';

        const newTask = {
            id: 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            title: title,
            date: date,
            time: time,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();

        // Reset title input
        taskTitleInput.value = '';
        taskTitleInput.focus();
    }

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function openEditModal(id) {
        editingTaskId = id;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        editTitleInput.value = task.title;
        editDateInput.value = task.date;
        editTimeInput.value = task.time;
        editValidationMsg.style.display = 'none';

        editModal.classList.add('show');
        setTimeout(() => editTitleInput.focus(), 100);
    }

    function closeEditModal() {
        editModal.classList.remove('show');
        editingTaskId = null;
        editValidationMsg.style.display = 'none';
    }

    function saveEditTask() {
        if (!editingTaskId) return;

        const title = editTitleInput.value.trim();
        const date = editDateInput.value;
        const time = editTimeInput.value;

        if (!title || !date || !time) {
            editValidationMsg.style.display = 'block';
            return;
        }

        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].title = title;
            tasks[taskIndex].date = date;
            tasks[taskIndex].time = time;
            saveTasks();
            renderTasks();
        }

        closeEditModal();
    }

    function openDeleteModal(id) {
        deletingTaskId = id;
        deleteModal.classList.add('show');
    }

    function closeDeleteModal() {
        deleteModal.classList.remove('show');
        deletingTaskId = null;
    }

    function confirmDeleteTask() {
        if (!deletingTaskId) return;

        tasks = tasks.filter(t => t.id !== deletingTaskId);
        saveTasks();
        renderTasks();
        closeDeleteModal();
    }

    // ----------------------------------------------------------------------
    // 6. RENDERING & SORTING
    // ----------------------------------------------------------------------
    function sortTasks(taskList) {
        // Sort by Date first, then Time (earlier tasks first)
        return [...taskList].sort((a, b) => {
            const dateTimeA = `${a.date}T${a.time}`;
            const dateTimeB = `${b.date}T${b.time}`;
            return dateTimeA.localeCompare(dateTimeB);
        });
    }

    function filterTasks() {
        if (activeFilter === 'active') {
            return tasks.filter(t => !t.completed);
        } else if (activeFilter === 'completed') {
            return tasks.filter(t => t.completed);
        }
        return tasks;
    }

    function updateCounts() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        totalCount.textContent = total;
        completedCount.textContent = completed;
    }

    function renderTasks() {
        updateCounts();
        taskListContainer.innerHTML = '';

        const filtered = filterTasks();
        const sorted = sortTasks(filtered);

        if (sorted.length === 0) {
            taskListContainer.appendChild(createEmptyState());
            return;
        }

        sorted.forEach(task => {
            taskListContainer.appendChild(createTaskElement(task));
        });
    }

    function createTaskElement(task) {
        const item = document.createElement('div');
        item.className = `task-item ${task.completed ? 'completed' : ''}`;
        item.setAttribute('data-id', task.id);

        const badgeInfo = getDateBadgeInfo(task.date, task.time, task.completed);

        item.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark completed">
                <div class="task-details">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    <div class="task-meta">
                        <span>${formatDateNice(task.date)} · ${formatTime12Hour(task.time)}</span>
                        ${badgeInfo ? `<span class="badge-tag ${badgeInfo.className}">${badgeInfo.text}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="task-right">
                <button type="button" class="action-btn edit" title="Edit task">Edit</button>
                <button type="button" class="action-btn delete" title="Delete task">Delete</button>
            </div>
        `;

        // Checkbox Listener
        const checkbox = item.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        // Edit Button Listener
        const editBtn = item.querySelector('.action-btn.edit');
        editBtn.addEventListener('click', () => openEditModal(task.id));

        // Delete Button Listener
        const deleteBtn = item.querySelector('.action-btn.delete');
        deleteBtn.addEventListener('click', () => openDeleteModal(task.id));

        return item;
    }

    function createEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerHTML = `
            <div class="empty-title">No tasks yet</div>
            <div class="empty-subtext">Add a task to get started!</div>
        `;
        return div;
    }

    // ----------------------------------------------------------------------
    // 7. FOCUS TIMER (25 Minutes)
    // ----------------------------------------------------------------------
    function startTimer() {
        if (timerState.isRunning) return;

        timerState.isRunning = true;
        startTimerBtn.style.display = 'none';
        pauseTimerBtn.style.display = 'inline-flex';
        if (timerStatus) {
            timerStatus.style.display = 'block';
            timerStatus.textContent = 'Focus session in progress...';
        }

        timerState.intervalId = setInterval(() => {
            if (timerState.remainingSeconds > 0) {
                timerState.remainingSeconds--;
                updateTimerDisplay();
            } else {
                // Timer reached 00:00
                pauseTimer();
                if (timerStatus) {
                    timerStatus.style.display = 'block';
                    timerStatus.textContent = 'Focus session complete!';
                }
            }
        }, 1000);
    }

    function pauseTimer() {
        timerState.isRunning = false;
        if (timerState.intervalId) {
            clearInterval(timerState.intervalId);
            timerState.intervalId = null;
        }
        startTimerBtn.style.display = 'inline-flex';
        pauseTimerBtn.style.display = 'none';
        if (timerState.remainingSeconds > 0 && timerStatus) {
            timerStatus.style.display = 'block';
            timerStatus.textContent = 'Timer paused.';
        }
    }

    function resetTimer() {
        pauseTimer();
        timerState.remainingSeconds = 25 * 60;
        updateTimerDisplay();
        if (timerStatus) {
            timerStatus.style.display = 'none';
            timerStatus.textContent = 'Ready to focus?';
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerState.remainingSeconds / 60);
        const secs = timerState.remainingSeconds % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // ----------------------------------------------------------------------
    // 8. DATE & TIME FORMATTERS
    // ----------------------------------------------------------------------
    function getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getDateBadgeInfo(dateStr, timeStr, isCompleted) {
        if (!dateStr) return null;
        const todayStr = getTodayString();

        // Calculate tomorrow string
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomYear = tomorrow.getFullYear();
        const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const tomDay = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

        // Overdue check
        if (!isCompleted) {
            const now = new Date();
            const taskDateTime = new Date(`${dateStr}T${timeStr}`);
            if (taskDateTime < now) {
                return { text: 'Overdue', className: 'badge-overdue' };
            }
        }

        if (dateStr === todayStr) return { text: 'Today', className: 'badge-today' };
        if (dateStr === tomorrowStr) return { text: 'Tomorrow', className: 'badge-tomorrow' };
        if (dateStr > todayStr) return { text: 'Upcoming', className: 'badge-upcoming' };

        return null;
    }

    function formatDateNice(dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatTime12Hour(time24) {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        let hours = parseInt(h, 10);
        const minutes = m || '00';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Launch app
    init();
});
