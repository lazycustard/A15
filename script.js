let currentDay = "monday";
let isAnimating = false;
const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const cleanText = (text) => text.trim().toLowerCase();
const skyBlueColor = {
    light: 'rgba(176, 196, 222, 0.2)',
    dark: 'rgba(126, 146, 172, 0.2)'
};

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

function checkAndSwitchToNextDay(now) {
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    if (currentHour >= 23 || (currentHour === 0 && currentMinutes < 60)) {
        const currentIndex = dayOrder.indexOf(currentDay);
        const nextDayIndex = (currentIndex + 1) % dayOrder.length;
        const nextDay = dayOrder[nextDayIndex];

        if (nextDay !== currentDay) {
            showTimetable(nextDay);
            showNotification(`Switched to ${nextDay.charAt(0).toUpperCase() + nextDay.slice(1)}'s timetable`);
        }
    }
}

function showTimetable(day) {
    if (day === currentDay || isAnimating) return;

    isAnimating = true; 

    const currentTimetable = document.getElementById(currentDay);
    const nextTimetable = document.getElementById(day);

    if (!currentTimetable || !nextTimetable) {
        isAnimating = false; 
        return;
    }

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

    currentTimetable.style.transition = 'none';
    nextTimetable.style.transition = 'none';

    void currentTimetable.offsetWidth;
    void nextTimetable.offsetWidth;

    nextTimetable.classList.remove('hidden');
    nextTimetable.style.transform = `translateX(${slideRight ? '100%' : '-100%'})`;
    nextTimetable.style.opacity = '0';

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


// Show current day's timetable
function showTodayTimetable() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    const dayName = days[today];

    // Show appropriate timetable based on current day
    if (document.getElementById(dayName)) {
        showTimetable(dayName);
    } else {
        showTimetable('monday'); // Default to Monday if today is Sunday
    }
}

function findNextOccurrence(className, type, teacherName) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    let nextClassInfo = null;
    let closestMinutes = Infinity;
    let foundNext = false;
    let completedFirstWeek = false;

    const cleanText = (text) => text.trim().toLowerCase();

    // Check for 14 days (2 weeks) to ensure we find the next occurrence
    for (let daysChecked = 0; daysChecked < 14; daysChecked++) {
        const checkDay = (currentDay + daysChecked) % 7; // Wrap around the week
        const dayTable = document.getElementById(days[checkDay]);

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
                    if (daysChecked === 0 && startTime <= currentTime) {
                        continue;
                    }

                    // If we haven't found any next occurrence yet, or if this one is sooner
                    if (!foundNext || totalMinutes < closestMinutes) {
                        closestMinutes = totalMinutes;
                        nextClassInfo = {
                            day: days[checkDay],
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

function addClassClickHandlers() {
    const tables = document.querySelectorAll('.timetable table');
    const cleanText = (text) => text.trim().toLowerCase();


    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        for (let i = 1; i < rows.length; i++) { // Skip header row
            const row = rows[i];
            const classCell = row.cells[1];
            const typeCell = row.cells[2];

            if (classCell && typeCell) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', () => {
                    const className = cleanText(classCell.textContent); // Sanitize class name
                    const type = cleanText(typeCell.textContent);       // Sanitize type
                    const teacherName = cleanText(row.cells[3].textContent); // Sanitize teacher name
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
window.onload = () => {
    loadTheme();
    cleanupAllTimetables();
    showTodayTimetable();
    updateClock();
    checkClasses();
    addClassClickHandlers();

    setInterval(() => {
        updateClock();
        checkClasses();
    }, 60000); 
};