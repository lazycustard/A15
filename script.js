// Utility functions for text manipulation and formatting
const cleanText = (text) => text.trim().toLowerCase();

// Global variables for timetable configuration
let currentDay = "monday";
let isAnimating = false;
const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const skyBlueColor = {
    light: 'rgba(176, 196, 222, 0.2)',
    dark: 'rgba(126, 146, 172, 0.2)'
};

/**
 * Initializes the timetable when the page loads
 * Sets up initial state and event handlers
 */
function initializeTimetable() {
    console.log('Initializing timetable...');
    
    // Get the current day
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    
    console.log('Current day:', today); // Debug log

    // First hide all timetables
    document.querySelectorAll('.timetable').forEach(table => {
        table.classList.add('hidden');
        table.classList.remove('active');
        table.style.transform = '';
        table.style.opacity = '';
        console.log('Hidden timetable:', table.id); // Debug log
    });

    // Try to show today's timetable, fallback to Monday if not available
    let targetDay = today;
    let targetTable = document.getElementById(today);
    
    console.log('Target table found:', targetTable ? 'yes' : 'no'); // Debug log

    // If today's timetable doesn't exist or it's Sunday, show Monday's timetable
    if (!targetTable || today === 'sunday') {
        targetDay = 'monday';
        targetTable = document.getElementById('monday');
        console.log('Falling back to Monday'); // Debug log
    }

    if (targetTable) {
        targetTable.classList.remove('hidden');
        targetTable.classList.add('active');
        targetTable.style.transform = 'translateX(0)';
        targetTable.style.opacity = '1';
        console.log(`Showing ${targetDay}'s timetable`); // Debug log
    } else {
        console.error('Failed to find target table!'); // Error log
    }

    // Set current day
    currentDay = targetDay;
    console.log('Current day set to:', currentDay); // Debug log

    // Update active button
    updateActiveButton();

    // Run initial class check
    checkClasses();
}

function getTimeInMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatTimeFromMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTimeLeft(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    let formattedTime = "";
    if (hours > 0) {
        formattedTime += `${hours}hr${hours > 1 ? 's' : ''} `;
    }
    if (mins > 0) {
        formattedTime += `${mins}min`;
    }
    return formattedTime.trim();
}

function checkClasses() {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const actualDay = days[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check if it's Sunday
    if (actualDay === 'sunday') {
        showNotification('No classes on Sunday');
        return;
    }

    const todayTimetable = document.getElementById(actualDay);
    if (!todayTimetable) return;

    const rows = todayTimetable.querySelectorAll('tr');
    let hasOngoingClass = false;
    let allClassesEnded = true;
    let earliestNextClass = Infinity;
    let earliestNextClassInfo = null;
    let lastClassEndTime = -1;

    document.querySelectorAll('.timetable tr').forEach(row => {
        row.classList.remove('ongoing');
    });

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const timeCell = row.cells[0];
        if (!timeCell) continue;

        const [startTimeStr, endTimeStr] = timeCell.textContent.split(' - ');
        const startTime = getTimeInMinutes(startTimeStr);
        const endTime = getTimeInMinutes(endTimeStr);

        lastClassEndTime = Math.max(lastClassEndTime, endTime);

        if (endTime > currentMinutes) {
            allClassesEnded = false;
        }

        if (currentMinutes >= startTime && currentMinutes <= endTime) {
            row.classList.add('ongoing');
            hasOngoingClass = true;

            const remainingMinutes = endTime - currentMinutes;
            const classInfo = `${row.cells[1].textContent} (${remainingMinutes} minutes remaining)`;
            showNotification(`Current class: ${classInfo}`);
        } else if (startTime > currentMinutes && startTime < earliestNextClass) {
            earliestNextClass = startTime;
            earliestNextClassInfo = {
                name: row.cells[1].textContent,
                time: startTimeStr,
                minutes: startTime - currentMinutes
            };
        }
    }

    if (allClassesEnded && !hasOngoingClass) {
        showNotification('All classes have ended for today');
        checkAndSwitchToNextDay(now);
    } else if (earliestNextClassInfo && !hasOngoingClass) {
        const timeLeft = formatTimeLeft(earliestNextClassInfo.minutes);
        showNotification(`Next class: ${earliestNextClassInfo.name} at ${earliestNextClassInfo.time} (${timeLeft} left)`);
    }
}

function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    notificationElement.innerHTML = message.replace(/\n/g, '<br>');
    notificationElement.classList.add('show');

    setTimeout(() => {
        notificationElement.classList.remove('show');
    }, 10000); 
}

// Define the checkAndSwitchToNextDay function
function checkAndSwitchToNextDay(now, lastClassEndTime, currentDay, dayOrder) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    console.log('Current Minutes:', currentMinutes);
    console.log('Last Class End Time:', lastClassEndTime);

    // Only switch after all classes are done and it's past midnight
    if (currentMinutes > lastClassEndTime) {
        const currentIndex = dayOrder.indexOf(currentDay);
        const nextDayIndex = (currentIndex + 1) % dayOrder.length;
        const nextDay = dayOrder[nextDayIndex];

        if (nextDay !== currentDay) {
            showTimetable(nextDay);
            showNotification(`Switched to ${nextDay.charAt(0).toUpperCase() + nextDay.slice(1)}'s timetable`);
        }
    }
}

// Array for days of the week
const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Dynamically get the current day
const currentDay = new Date().toLocaleString('en-us', { weekday: 'long' }); // Example: 'Monday'

// Call the function to check and switch to the next day if needed
checkAndSwitchToNextDay(new Date(), 540, currentDay, dayOrder);

function showTimetable(day) {
    if (day === currentDay || isAnimating) return;

    isAnimating = true;
    console.log('Switching to:', day);

    const currentTimetable = document.getElementById(currentDay);
    const nextTimetable = document.getElementById(day);

    if (!currentTimetable || !nextTimetable) {
        isAnimating = false;
        return;
    }

    // Hide all other timetables
    document.querySelectorAll('.timetable').forEach(table => {
        if (table.id !== currentDay && table.id !== day) {
            table.classList.add('hidden');
            table.style.transform = '';
            table.style.opacity = '';
        }
    });

    const currentIndex = dayOrder.indexOf(currentDay);
    const nextIndex = dayOrder.indexOf(day);
    const slideRight = nextIndex > currentIndex;

    // Animation setup
    currentTimetable.style.transition = 'none';
    nextTimetable.style.transition = 'none';
    
    nextTimetable.classList.remove('hidden');
    nextTimetable.style.transform = `translateX(${slideRight ? '100%' : '-100%'})`;
    nextTimetable.style.opacity = '0';

    // Trigger animation
    requestAnimationFrame(() => {
        currentTimetable.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        nextTimetable.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';

        requestAnimationFrame(() => {
            currentTimetable.style.transform = `translateX(${slideRight ? '-100%' : '100%'})`;
            currentTimetable.style.opacity = '0';
            nextTimetable.style.transform = 'translateX(0)';
            nextTimetable.style.opacity = '1';

            setTimeout(() => {
                currentTimetable.classList.add('hidden');
                currentTimetable.style.transform = '';
                currentTimetable.style.opacity = '';
                currentDay = day;
                updateActiveButton();
                checkClasses();
                isAnimating = false;
            }, 500);
        });
    });
}

function resetTimetable(timetable) {
    if (!timetable) return;
    timetable.style.transition = 'none';
    timetable.style.transform = '';
    timetable.style.opacity = '';
    timetable.classList.add('hidden');
}

function cleanupAllTimetables() {
    document.querySelectorAll('.timetable').forEach(resetTimetable);
}

function updateActiveButton() {
    document.querySelectorAll('.day-buttons button').forEach(button => {
        button.classList.remove('active');
    });
    const activeButton = document.getElementById(`btn-${currentDay}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function updateClock() {
    const clockElement = document.getElementById('live-clock');
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    clockElement.textContent = now.toLocaleString(undefined, options);
}

function toggleTheme() {
    const body = document.documentElement;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);

    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';

    localStorage.setItem('theme', newTheme);

    // Apply sky blue color based on theme
    const color = newTheme === 'dark' ? skyBlueColor.dark : skyBlueColor.light;
    document.documentElement.style.setProperty('--ongoing-class-bg', color);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
    
    // Apply sky blue color based on theme
    const color = savedTheme === 'dark' ? skyBlueColor.dark : skyBlueColor.light;
    document.documentElement.style.setProperty('--ongoing-class-bg', color);
}

/**
 * Finds the next occurrence of a class based on class name, type, and teacher
 * @param {string} className - Name of the class to find
 * @param {string} type - Type of the class (lecture, lab, etc)
 * @param {string} teacherName - Name of the teacher
 * @returns {Object|null} Next class occurrence info or null if not found
 */
function findNextOccurrence(className, type, teacherName) {
    const now = new Date();
    const currentDay = getCurrentDay();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    let foundInCurrentDay = false;
    
    let nextClassInfo = null;
    let closestMinutes = Infinity;
    let foundNext = false;
    let completedFirstWeek = false;

    // Check for 14 days (2 weeks) to ensure we find the next occurrence
    for (let daysChecked = 0; daysChecked < 14; daysChecked++) {
        const checkDay = (currentDay + daysChecked) % 7; // Wrap around the week
        const dayTable = document.getElementById(dayOrder[checkDay]);

        if (dayTable) {
            const rows = dayTable.querySelectorAll('tr');
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const classCell = row.cells[1];
                const typeCell = row.cells[2];
                const teacherCell = row.cells[3];
                const timeCell = row.cells[0];

                if (
                    cleanText(classCell.textContent) === cleanText(className) &&
                    cleanText(typeCell.textContent) === cleanText(type) &&
                    cleanText(teacherCell.textContent) === cleanText(teacherName)
                ) {
                    const [startTimeStr] = timeCell.textContent.split(' - ');
                    const startTime = getTimeInMinutes(startTimeStr);
                    const totalMinutes = startTime + daysChecked * 24 * 60;

                    // For same day, only consider future classes
                    if (daysChecked === 0 && startTime <= currentTimeInMinutes) {
                        continue;
                    }

                    // If we haven't found any next occurrence yet, or if this one is sooner
                    if (!foundNext || totalMinutes < closestMinutes) {
                        closestMinutes = totalMinutes;
                        nextClassInfo = {
                            day: dayOrder[checkDay],
                            time: timeCell.textContent,
                            room: row.cells[4].textContent,
                            teacher: teacherCell.textContent,
                            daysUntil: daysChecked
                        };
                        foundNext = true;
                    }
                }
            }
        }

        // Mark when we've completed checking the first week
        if (daysChecked === 6) {
            completedFirstWeek = true;
        }

        // If we've found a class and completed checking the current week,
        // we can stop searching
        if (foundNext && completedFirstWeek) {
            break;
        }
    }

    return nextClassInfo;
}

/**
 * Adds click handlers to class rows in the timetable
 * Shows information about the next occurrence of the clicked class
 */
function addClassClickHandlers() {
    const tables = document.querySelectorAll('.timetable table');

    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) { // Skip header row
            const row = rows[i];
            const classCell = row.cells[1];

            // Special handling for holiday rows
            if (!classCell || cleanText(classCell.textContent) === 'holiday') {
                row.style.cursor = 'default';
                continue;
            }

            const typeCell = row.cells[2];

            if (classCell && typeCell) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', () => {
                    const className = cleanText(classCell.textContent);
                    const type = cleanText(typeCell.textContent);
                    const teacherName = cleanText(row.cells[3].textContent);
                    const nextClass = findNextOccurrence(className, type, teacherName);

                    if (nextClass) {
                        let message = '';
                        if (nextClass.daysUntil === 0) {
                            message = `Next ${className} (${type}) is today at ${nextClass.time}`;
                        } else {
                            const dayName = nextClass.day.charAt(0).toUpperCase() + nextClass.day.slice(1);
                            message = `Next ${className} (${type}) is on ${dayName} at ${nextClass.time}`;
                        }
                        message += `\nTeacher: ${nextClass.teacher}\nRoom: ${nextClass.room}`;
                        showNotification(message);
                    } else {
                        showNotification(`No upcoming ${className} (${type}) found in the next 7 days.`);
                    }
                });
            }
        }
    });
}

// Add this new function to help with testing
function testDayInitialization(dayToTest) {
    console.log(`Testing initialization for ${dayToTest}...`);
    
    // Mock the Date object
    const RealDate = Date;
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() + (dayToTest === 'sunday' ? 0 : ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayToTest) - mockDate.getDay()));
    
    global.Date = class extends RealDate {
        constructor() {
            super();
            return mockDate;
        }
    };

    // Run initialization
    initializeTimetable();

    // Restore the real Date object
    global.Date = RealDate;
}

// Modify window.onload to include error handling
window.onload = () => {
    try {
        console.log('Window loaded');
        
        // Initialize theme first
        loadTheme();
        
        // Initialize timetable
        initializeTimetable();
        
        // Initialize other components
        updateClock();
        addClassClickHandlers();

        // Set up intervals for updates
        setInterval(() => {
            updateClock();
            checkClasses();
        }, 60000);
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};
