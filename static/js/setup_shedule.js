document.addEventListener('DOMContentLoaded', function () {
    const scheduleBody = document.getElementById('schedule-body');
    const timeHeader = document.getElementById('time-header');
    const intervalMinutes = 30;  
    const sliderRangeLabel = document.getElementById('sliderRangeLabel');
    const defaultStartHour = 9 * 60; // 9:00 AM in minutes
    const defaultEndHour = 20 * 60; // 7:00 PM in minutes
    

    let isMouseDown = false;
    let isDeselecting = false;
    let startCell = null;
    let selectedCells = new Set();
    

    // Function to format time to "HH:MM"
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    // Function to update the range label with time
    function updateRangeLabel(min, max) {
        const formattedMin = formatTime(min);
        const formattedMax = formatTime(max);
        sliderRangeLabel.textContent = `${formattedMin} - ${formattedMax}`;
    }

    // Function to save currently selected cells
    function saveSelectedCells() {
        selectedCells.clear();
        scheduleBody.querySelectorAll('.time-slot.selected').forEach(cell => {
            selectedCells.add(cell.dataset.time.split('-')[1]); // Save only the time part
        });
    }

    // Function to restore selected cells
    function restoreSelectedCells() {
        scheduleBody.querySelectorAll('.time-slot').forEach(cell => {
            if (selectedCells.has(cell.dataset.time.split('-')[1])) {
                cell.classList.add('selected');
            }
        });
    }

    // Initialize slider and handlers
    $('.slider').bootstrapSlider().on('slide', function (event) {
        const [min, max] = event.value;
        updateRangeLabel(min, max);
        saveSelectedCells();  // Save selected cells before updating the grid
        updateTimeSlots(min, max);
        restoreSelectedCells();  // Restore selected cells after updating the grid
    });

    // Update time slots in the header and grid
    function updateTimeSlots(startMinutes, endMinutes) {
        timeHeader.innerHTML = '<th> </th>'; // Reset header

        for (let time = startMinutes; time <= endMinutes; time += intervalMinutes) {
            const timeSlot = document.createElement('th');
            timeSlot.textContent = formatTime(time);
            timeHeader.appendChild(timeSlot);
        }

        scheduleBody.querySelectorAll('tr').forEach(row => {
            const dayName = row.querySelector('td').textContent; // Save the day name
            row.innerHTML = `<td>${dayName}</td>`; // Reset row cells
 
            for (let time = startMinutes; time <= endMinutes; time += intervalMinutes) {
                const cell = document.createElement('td');
                cell.classList.add('time-slot');
                cell.dataset.time = `${dayName}-${time}`; // Save a unique identifier for the cell
                cell.dataset.minutes = time; // Save only the numeric time for simplicity
                cell.addEventListener('mousedown', handleMouseDown);
                cell.addEventListener('mouseover', handleMouseOver);
                row.appendChild(cell);
            }
        });
    }

    // Functions to handle selection
    function handleMouseDown(event) {
        isMouseDown = true;
        startCell = event.target;
        isDeselecting = event.target.classList.contains('selected');
        toggleCellSelection(startCell, isDeselecting);
        event.preventDefault();
    }

    function handleMouseOver(event) {
        if (isMouseDown) {
            selectCellsInRange(startCell, event.target, isDeselecting);
        }
    }

    // Function to select or deselect cells in range
    function selectCellsInRange(start, end, deselecting) {
        const rows = Array.from(scheduleBody.querySelectorAll('tr'));
        const startRowIndex = rows.findIndex(row => row.contains(start));
        const endRowIndex = rows.findIndex(row => row.contains(end));
        
        const startCellIndex = Array.from(start.parentNode.children).indexOf(start);
        const endCellIndex = Array.from(end.parentNode.children).indexOf(end);
        
        const minRowIndex = Math.min(startRowIndex, endRowIndex);
        const maxRowIndex = Math.max(startRowIndex, endRowIndex);
        const minCellIndex = Math.min(startCellIndex, endCellIndex);
        const maxCellIndex = Math.max(startCellIndex, endCellIndex);

        for (let i = minRowIndex; i <= maxRowIndex; i++) {
            for (let j = minCellIndex; j <= maxCellIndex; j++) {
                toggleCellSelection(rows[i].children[j], deselecting);
            }
        }
    }

    // Function to toggle cell selection
    function toggleCellSelection(cell, deselecting) {
        if (deselecting) {
            cell.classList.remove('selected');
        } else {
            cell.classList.add('selected');
        }
    }

    function fetchAndUpdateSchedule(uuid) {
        fetch(`/specialist/${uuid}/schedule/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
        })
        .then(response => response.json())
        .then(data => {
            let businessHours = [];
            if (data.schedule) {
                businessHours = data.schedule.map(scheduleItem => ({
                    daysOfWeek: scheduleItem.dow,
                    startTime: scheduleItem.start,
                    endTime: scheduleItem.end
                }));
            }
    
            // Обновляем календарь
            window.sharedData.updateCalendar(uuid, businessHours);
        })
        .catch(error => {
            console.error('Ошибка получения расписания:', error);
        });
    }
    // Initial grid setup
    updateTimeSlots(defaultStartHour, defaultEndHour);

    document.addEventListener('mouseup', function () {
        isMouseDown = false;
    });

    // Save schedule handler
    document.getElementById('saveScheduleBtn').addEventListener('click', function () {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const scheduleName = document.getElementById('scheduleName').value;
        const selectedSlots = [];
        const scheduleModal = document.getElementById('scheduleSettingsModal');
        const scheduleModal1 = new bootstrap.Modal(document.getElementById('scheduleModal'));

        const scheduleModalClsBtn = document.getElementById('btn-close');
        const modalInstance = bootstrap.Modal.getInstance(scheduleModal);
        const rows = document.querySelectorAll('#schedule-body tr');
        
        const slotsByDay = {};
        const intervalMinutes = 30;  

        rows.forEach((row, dayIndex) => {
            const day = dayIndex + 1;
            row.querySelectorAll('.time-slot.selected').forEach(slot => {
                const timeInMinutes = parseInt(slot.dataset.minutes);
                if (!slotsByDay[day]) {
                    slotsByDay[day] = { start: timeInMinutes, end: timeInMinutes };
                } else {
                    slotsByDay[day].end = timeInMinutes;
                }
            });
        });

        if (scheduleName.trim() === '') {
            alert('Please enter a schedule name.');
            return;
        }
        if (scheduleModalClsBtn) {
            modalInstance.hide();
            scheduleModal1.show();
        }

        fetch('/save_schedule/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                name: scheduleName,
                slots: Object.keys(slotsByDay).map(day => ({
                    dow: [parseInt(day)],
                    start: formatTime(slotsByDay[day].start),
                    end: formatTime(slotsByDay[day].end + intervalMinutes)
                }))
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Schedule saved successfully!');
                modalInstance.hide();  // Close the second modal

                // Perform AJAX request to update the list of schedules in the first modal
                fetch('/get_schedules/')
                    .then(response => response.json())
                    .then(data => {
                        const scheduleSelect = document.getElementById('scheduleSelect');
                        scheduleSelect.innerHTML = ''; // Clear existing options

                        data.schedules.forEach(schedule => {
                            const option = document.createElement('option');
                            option.value = schedule.id;
                            option.textContent = schedule.name;
                            scheduleSelect.appendChild(option);
                        });

                        // Open the first modal
                        const scheduleModal1 = new bootstrap.Modal(document.getElementById('scheduleModal'));
                        scheduleModal1.show();
                    })
                    .catch(error => {
                        console.error('Error fetching schedules:', error);
                    });
            } else {
                alert('Error saving schedule.');
            }
        })
        .catch(error => {
            console.error('Error saving schedule:', error);
        });
    });

    document.getElementById('closeScheduleSettingsBtn').addEventListener('click', function () {
        const scheduleSettingsModal = document.getElementById('scheduleSettingsModal');
        const modalInstance = bootstrap.Modal.getInstance(scheduleSettingsModal);

        // Close the second modal
        if (modalInstance) {
            modalInstance.hide();
        }

        // Open the first modal
        const scheduleModal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        scheduleModal.show();
    });

    document.getElementById('applyScheduleBtn').addEventListener('click', function () {
        const scheduleSelect = document.getElementById('scheduleSelect');
        const selectedScheduleId = scheduleSelect.value;
        const specialistId = document.getElementById('specialist-uuid').value;
        const csrftoken = document.getElementById('csrf-token').value;

        console.log('!UUID specialist:', specialistId);

        if (!selectedScheduleId) {
            alert('Please select a schedule.');
            return;
        }

        fetch('/apply_schedule/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                schedule_id: selectedScheduleId,
                specialist_uuid: specialistId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Schedule applied successfully!');
                // Close the schedule modal
                const scheduleModal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
                console.log('new_schedule schedule:', data);

                updateCalendar(specialistId, data.new_schedule, csrftoken);

                scheduleModal.hide();

                // Optionally, refresh the page or update the UI to reflect the new schedule applied to the specialist
                // For example, you can fetch the updated schedule and display it on the page
            } else {
                alert(`Error applying schedule: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error applying schedule:', error);
            alert('Error applying schedule.');
        });
    });

});