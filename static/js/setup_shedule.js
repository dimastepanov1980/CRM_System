document.addEventListener('DOMContentLoaded', function () {
    const elements = {
        scheduleBody: document.getElementById('schedule-body'),
        timeHeader: document.getElementById('time-header'),
        sliderRangeLabel: document.getElementById('sliderRangeLabel'),
    };
    
    const config = {
        intervalMinutes: 30,
        defaultStartHour: 9 * 60, // 9:00 AM in minutes
        defaultEndHour: 20 * 60, // 7:00 PM in minutes,
    };

    const state = {
        isMouseDown: false,
        isDeselecting: false,
        startCell: null,
        selectedCells: new Set(),
    };

    // Обработчик события для снятия состояния нажатия мыши
    document.addEventListener('mouseup', () => state.isMouseDown = false);


    // Инициализация временных слотов по умолчанию
    updateTimeSlots(config.defaultStartHour, config.defaultEndHour);

    // Вызов функции для обновления расписаний при загрузке страницы
    updateSchedules();

    // Функция форматирования времени в "HH:MM"
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    // Обновление диапазона времени в слайдере
    function updateRangeLabel(min, max) {
        elements.sliderRangeLabel.textContent = `${formatTime(min)} - ${formatTime(max)}`;
    }

    // Сохранение выбранных ячеек
    function saveSelectedCells() {
        state.selectedCells.clear();
        elements.scheduleBody.querySelectorAll('.time-slot.selected').forEach(cell => {
            state.selectedCells.add(cell.dataset.time.split('-')[1]);
        });
    }

    // Восстановление ранее выбранных ячеек
    function restoreSelectedCells() {
        elements.scheduleBody.querySelectorAll('.time-slot').forEach(cell => {
            if (state.selectedCells.has(cell.dataset.time.split('-')[1])) {
                cell.classList.add('selected');
            }
        });
    }

    // Инициализация слайдера и обработчиков
    $('.slider').bootstrapSlider().on('slide', event => {
        const [min, max] = event.value;
        updateRangeLabel(min, max);
        saveSelectedCells();
        updateTimeSlots(min, max);
        restoreSelectedCells();
    });

    // Обновление временных слотов в заголовке и сетке
    function updateTimeSlots(startMinutes, endMinutes) {
        elements.timeHeader.innerHTML = '<th> </th>'; // Сброс заголовка

        for (let time = startMinutes; time <= endMinutes; time += config.intervalMinutes) {
            const timeSlot = document.createElement('th');
            timeSlot.textContent = formatTime(time);
            elements.timeHeader.appendChild(timeSlot);
        }

        elements.scheduleBody.querySelectorAll('tr').forEach(row => {
            const dayName = row.querySelector('td').textContent; // Сохранение имени дня
            row.innerHTML = `<td>${dayName}</td>`; // Сброс ячеек строки

            for (let time = startMinutes; time <= endMinutes; time += config.intervalMinutes) {
                const cell = document.createElement('td');
                cell.classList.add('time-slot');
                cell.dataset.time = `${dayName}-${time}`;
                cell.dataset.minutes = time;
                cell.addEventListener('mousedown', handleMouseDown);
                cell.addEventListener('mouseover', handleMouseOver);
                row.appendChild(cell);
            }
        });
    }

    // Обработчики выбора ячеек
    function handleMouseDown(event) {
        state.isMouseDown = true;
        state.startCell = event.target;
        state.isDeselecting = event.target.classList.contains('selected');
        toggleCellSelection(state.startCell, state.isDeselecting);
        event.preventDefault();
    }

    function handleMouseOver(event) {
        if (state.isMouseDown) {
            selectCellsInRange(state.startCell, event.target, state.isDeselecting);
        }
    }

    // Выбор или снятие выбора ячеек в диапазоне
    function selectCellsInRange(start, end, deselecting) {
        const rows = Array.from(elements.scheduleBody.querySelectorAll('tr'));
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

    // Переключение состояния выбора ячеек
    function toggleCellSelection(cell, deselecting) {
        cell.classList.toggle('selected', !deselecting);
    }

    // Обнов
    function updateSchedules() {
        const dayNames = {
            1: 'Mon.',
            2: 'Tue.',
            3: 'Wed.',
            4: 'Thu.',
            5: 'Fri.',
            6: 'Sat.',
            7: 'Sun.'
        };
    
        fetch('/get_schedules/')
            .then(response => response.json())
            .then(data => {
                // Обновление select
                const scheduleSelect = document.getElementById('scheduleSelect');
                if (scheduleSelect) {
                    scheduleSelect.innerHTML = ''; // Очистка существующих опций
    
                    data.schedules.forEach(schedule => {
                        const option = document.createElement('option');
                        option.value = schedule.id;
                        option.textContent = schedule.name;
                        scheduleSelect.appendChild(option);
                    });
                }
    
                // Обновление таблицы
                const tableBody = document.getElementById('scheduleTableBody');
                if (tableBody) {
                    tableBody.innerHTML = ''; // Очистка таблицы перед добавлением новых данных
    
                    data.schedules.forEach(schedule => {
                        const row = document.createElement('tr');
    
                        // Создаем ячейку с именем расписания
                        const nameCell = document.createElement('td');
                        nameCell.textContent = schedule.name;
                        row.appendChild(nameCell);
    
                        // Создаем ячейку для специалистов
                        const specialistsCell = document.createElement('td');
                        if (schedule.specialists.length > 0) {
                            specialistsCell.textContent = schedule.specialists.map(spec => spec.name).join(', ');
                        } else {
                            specialistsCell.textContent = 'No specialists assigned';
                        }
                        row.appendChild(specialistsCell);
    
                        // Создаем ячейку для записей расписания
                        const entriesCell = document.createElement('td');
                        if (schedule.schedule_entries.length > 0) {
                            entriesCell.textContent = schedule.schedule_entries.map(entry => {
                                const dayName = dayNames[entry.day_of_week];  // Преобразуем числовое значение дня недели в название
                                const startTime = entry.start_time.slice(0, 5);  // Обрезаем секунды
                                const endTime = entry.end_time.slice(0, 5);  // Обрезаем секунды
                                return `${dayName} ${startTime} - ${endTime}`;
                            }).join(', ');
                        } else {
                            entriesCell.textContent = 'No entries';
                        }
                        row.appendChild(entriesCell);
    
                        // Создаем ячейки с кнопками для редактирования и удаления
                        const actionsCell = document.createElement('td');
                        const editButton = document.createElement('button');
                        editButton.classList.add('btn', 'btn-warning');
                        editButton.setAttribute('data-bs-toggle', 'modal');
                        editButton.setAttribute('data-bs-target', `#editScheduleModal${schedule.id}`);
                        editButton.textContent = 'Редактировать';
                        actionsCell.appendChild(editButton);
    
                        const deleteButton = document.createElement('button');
                        deleteButton.classList.add('btn', 'btn-danger');
                        deleteButton.setAttribute('data-bs-toggle', 'modal');
                        deleteButton.setAttribute('data-bs-target', `#deleteScheduleModal${schedule.id}`);
                        deleteButton.textContent = 'Удалить';
                        actionsCell.appendChild(deleteButton);
    
                        row.appendChild(actionsCell);
    
                        tableBody.appendChild(row);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching schedules:', error);
            });
    }
    
    // Save schedule handler
    const saveScheduleBtn = document.getElementById('saveScheduleBtn');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', function () {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const scheduleName = document.getElementById('scheduleName').value;
            const selectedSlots = [];
            const scheduleModal = document.getElementById('scheduleSettingsModal');
            const scheduleModalElement = document.getElementById('scheduleModal');
            let scheduleModal1;

            if (scheduleModalElement) {
                scheduleModal1 = new bootstrap.Modal(scheduleModalElement);
            }

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

            if (scheduleModalClsBtn && modalInstance) {
                modalInstance.hide();
                if (scheduleModal1) {
                    scheduleModal1.show();
                }
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
                    modalInstance.hide();  // Закрытие второго модального окна
            
                    // Обновляем select и таблицу
                    updateSchedules();
            
                    // Открываем первое модальное окно (если требуется)
                    if (scheduleModal1) {
                        scheduleModal1.show();
                    }
                } else {
                    alert('Error saving schedule.');
                }
            })
            .catch(error => {
                console.error('Error saving schedule:', error);
            });
        });
    }

    const closeScheduleSettingsBtn = document.getElementById('closeScheduleSettingsBtn');
    if (closeScheduleSettingsBtn) {
        closeScheduleSettingsBtn.addEventListener('click', function () {
            const scheduleSettingsModal = document.getElementById('scheduleSettingsModal');
            const modalInstance = bootstrap.Modal.getInstance(scheduleSettingsModal);

            // Закрываем второе модальное окно
            if (modalInstance) {
                modalInstance.hide();
            }

            // Открываем первое модальное окно
            const scheduleModalElement = document.getElementById('scheduleModal');
            if (scheduleModalElement) {
                const scheduleModal = new bootstrap.Modal(scheduleModalElement);
                scheduleModal.show();
            }
        });
    }

    const applyScheduleBtn = document.getElementById('applyScheduleBtn');
    if (applyScheduleBtn) {
        applyScheduleBtn.addEventListener('click', function () {
            const scheduleSelect = document.getElementById('scheduleSelect');
            const selectedScheduleId = scheduleSelect.value;
            const specialistId = document.getElementById('specialist-uuid').value;
            const csrftoken = document.getElementById('csrf-token').value;

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

                    // Закрываем модальное окно
                    const scheduleModal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
                    if (scheduleModal) {
                        scheduleModal.hide();
                    }

                    console.log('new_schedule schedule:', data);

                    // Обновляем календарь или UI после применения расписания
                    updateCalendar(specialistId, data.new_schedule, csrftoken);

                    // При необходимости можно обновить UI или страницу, чтобы отразить новые данные
                } else {
                    alert(`Error applying schedule: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error applying schedule:', error);
                alert('Error applying schedule.');
            });
        });
    }

});