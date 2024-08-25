document.addEventListener('DOMContentLoaded', function () {
    const elements = {
        scheduleBody: document.getElementById('schedule-body'),
        timeHeader: document.getElementById('time-header'),
        sliderRangeLabel: document.getElementById('sliderRangeLabel'),
        scheduleIdInput: document.getElementById('scheduleId'), // Поле для хранения ID расписания
        scheduleNameInput: document.getElementById('scheduleName'),
        scheduleModal: document.getElementById('scheduleSettingsModal'),

        saveScheduleBtn: document.getElementById('saveScheduleBtn'),
        closeScheduleSettingsBtn: document.getElementById('closeScheduleSettingsBtn'),
        applyScheduleBtn: document.getElementById('applyScheduleBtn'),
        addSpecialistsModal: document.getElementById('addSpecialistsModal'),
        assignSpecialistsBtn: document.getElementById('assignSpecialistsBtn'),
        saveSpecialistsBtn: document.getElementById('saveSpecialistsBtn'),
        selectSchedule: document.getElementById('selectSchedule'),
        specialistsList: document.getElementById('specialistsList'),

        deleteScheduleModal: document.getElementById('deleteScheduleModal'),
        deleteScheduleWarning: document.getElementById('deleteScheduleWarning'),
        confirmDeleteScheduleBtn: document.getElementById('confirmDeleteScheduleBtn'),
    };
    
    const config = {
        intervalMinutes: 30,
        defaultStartHour: 9 * 60, // 9:00 AM in minutes
        defaultEndHour: 20 * 60, // 7:00 PM in minutes
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

    // Прорисовка таблицы
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
    
                        // Создаем ячейку с иконкой и выпадающим меню
                        const actionsCell = document.createElement('td');
                        const dropdownDiv = document.createElement('div');
                        dropdownDiv.classList.add('dropdown');
    
                        const dropdownButton = document.createElement('button');
                        dropdownButton.classList.add('btn', 'dropdown-toggle');
                        dropdownButton.setAttribute('id', `dropdownMenuButton${schedule.id}`);
                        dropdownButton.setAttribute('data-bs-toggle', 'dropdown');
                        dropdownButton.setAttribute('aria-expanded', 'false');
                        dropdownButton.textContent = '...';
    
                        const dropdownMenu = document.createElement('ul');
                        dropdownMenu.classList.add('dropdown-menu');
                        dropdownMenu.setAttribute('aria-labelledby', `dropdownMenuButton${schedule.id}`);
    
                        const editMenuItem = document.createElement('li');
                        const editLink = document.createElement('a');
                        editLink.classList.add('dropdown-item');
                        editLink.setAttribute('href', '#'); // href не нужен для кнопок, открывающих модальные окна
                        editLink.setAttribute('data-bs-toggle', 'modal');
                        editLink.setAttribute('data-bs-target', '#scheduleSettingsModal'); // Ссылка на единое модальное окно
                        editLink.setAttribute('data-schedule-id', schedule.id); // Передача ID расписания
                        editLink.textContent = 'Edit';
                        editMenuItem.appendChild(editLink);
    
                        const deleteMenuItem = document.createElement('li');
                        const deleteLink = document.createElement('a');
                        deleteLink.classList.add('dropdown-item');
                        deleteLink.setAttribute('href', '#'); // href не нужен для кнопок, открывающих модальные окна
                        deleteLink.setAttribute('data-bs-toggle', 'modal');
                        deleteLink.setAttribute('data-bs-target', '#deleteScheduleModal');
                        deleteLink.setAttribute('data-schedule-id', schedule.id); // Передача ID расписания
                        deleteLink.textContent = 'Delete';
                        deleteMenuItem.appendChild(deleteLink);
    
                        dropdownMenu.appendChild(editMenuItem);
                        dropdownMenu.appendChild(deleteMenuItem);
    
                        dropdownDiv.appendChild(dropdownButton);
                        dropdownDiv.appendChild(dropdownMenu);
                        actionsCell.appendChild(dropdownDiv);
    
                        row.appendChild(actionsCell);
                        tableBody.appendChild(row);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching schedules:', error);
            });
    }

    function parseTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function updateTimeSlotsWithData(slots) {
        // Очищаем текущие выделенные ячейки
        state.selectedCells.clear();
    
        // Снимаем выделение с всех ячеек
        elements.scheduleBody.querySelectorAll('.time-slot.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Проходим по всем ячейкам и выделяем те, которые соответствуют слоту
        elements.scheduleBody.querySelectorAll('.time-slot').forEach(cell => {
            const [dayName, time] = cell.dataset.time.split('-');
            const dayOfWeek = getDayOfWeekNumber(dayName);
            const cellTime = parseInt(cell.dataset.minutes); // Используем время в минутах
        
            // Проходим по каждому слоту
            slots.forEach(slot => {
                const startTimeInMinutes = parseTimeToMinutes(slot.start_time);
                const endTimeInMinutes = parseTimeToMinutes(slot.end_time);
        
                // Проверяем, попадает ли время ячейки в интервал времени слота
                if (dayOfWeek === slot.day_of_week && cellTime >= startTimeInMinutes && cellTime < endTimeInMinutes) {
                    cell.classList.add('selected');
                    state.selectedCells.add(cell.dataset.time);
                }
            });
        });
    }
    
    // Функция для преобразования названия дня недели в номер
    function getDayOfWeekNumber(dayName) {
        const dayNames = {
            'Mon.': 1,
            'Tue.': 2,
            'Wed.': 3,
            'Thu.': 4,
            'Fri.': 5,
            'Sat.': 6,
            'Sun.': 7
        };
        return dayNames[dayName] || null;
    }
    
    elements.scheduleModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const scheduleId = button.getAttribute('data-schedule-id');
    
        if (scheduleId) {
            fetch(`/get_schedule_by_id/${scheduleId}/`)
                .then(response => {
                    if (!response.ok) {
                        console.error(`Server returned ${response.status} for ${response.url}`);
                        return response.text();
                    }
                    return response.json();
                })
                .then(data => {
                    if (typeof data === 'string') {
                        console.error('Received HTML instead of JSON:', data);
                    } else {
                        elements.scheduleIdInput.value = data.id;
                        elements.scheduleNameInput.value = data.name;
                        console.log('get data slots:', data.slots);

                        updateTimeSlotsWithData(data.slots);
                    }
                })
                .catch(error => console.error('Error fetching schedule:', error));
        } else {
            elements.scheduleIdInput.value = '';
            elements.scheduleNameInput.value = '';
            updateTimeSlots(config.defaultStartHour, config.defaultEndHour);
        }
    });
    
    if (elements.saveScheduleBtn) {
        elements.saveScheduleBtn.addEventListener('click', function () {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const scheduleId = elements.scheduleIdInput.value;  // Проверяем, существует ли идентификатор расписания
            const scheduleName = document.getElementById('scheduleName').value;
            const scheduleModal = document.getElementById('scheduleSettingsModal');
            const scheduleModalElement = document.getElementById('scheduleModal');
            let scheduleModal1;
    
            if (scheduleModalElement) {
                scheduleModal1 = new bootstrap.Modal(scheduleModalElement);
            }
    
            const scheduleModalClsBtn = document.getElementById('btn-close');
            const modalInstance = bootstrap.Modal.getInstance(scheduleModal);
    
            if (scheduleName.trim() === '') {
                alert('Please enter a schedule name.');
                return;
            }
    
            // Собираем данные временных интервалов для каждого дня недели
            const slotsByDay = {};
            const rows = document.querySelectorAll('#schedule-body tr');
            
            rows.forEach((row, dayIndex) => {
                const day = dayIndex + 1;
                let currentSlot = null;
    
                row.querySelectorAll('.time-slot.selected').forEach(slot => {
                    const timeInMinutes = parseInt(slot.dataset.minutes);
    
                    if (!currentSlot) {
                        // Создаем новый слот
                        currentSlot = {
                            start: timeInMinutes,
                            end: timeInMinutes + config.intervalMinutes
                        };
                    } else {
                        // Проверяем, что текущий слот не прерывается
                        if (timeInMinutes === currentSlot.end) {
                            currentSlot.end = timeInMinutes + config.intervalMinutes;
                        } else {
                            // Сохраняем завершенный слот
                            if (!slotsByDay[day]) {
                                slotsByDay[day] = [];
                            }
                            slotsByDay[day].push(currentSlot);
                            // Начинаем новый слот
                            currentSlot = {
                                start: timeInMinutes,
                                end: timeInMinutes + config.intervalMinutes
                            };
                        }
                    }
                });
    
                // Сохраняем последний слот для данного дня
                if (currentSlot) {
                    if (!slotsByDay[day]) {
                        slotsByDay[day] = [];
                    }
                    slotsByDay[day].push(currentSlot);
                }
            });
    
            // Формируем массив слотов для отправки на сервер
            const slots = [];
            for (const [day, intervals] of Object.entries(slotsByDay)) {
                intervals.forEach(interval => {
                    slots.push({
                        dow: [parseInt(day)],
                        start: formatTime(interval.start),
                        end: formatTime(interval.end)
                    });
                });
            }
    
            const payload = {
                name: scheduleName,
                slots: slots
            };
    
            // Выводим данные в консоль перед отправкой на сервер
            console.log('Data to be sent to server:', JSON.stringify(payload, null, 2));
    
            // URL и метод запроса зависят от того, создаем мы новое расписание или обновляем существующее
            const url = scheduleId ? `/update_schedule/${scheduleId}/` : '/save_schedule/';
            const method = scheduleId ? 'PUT' : 'POST';
    
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(payload)
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
    
    if (elements.closeScheduleSettingsBtn) {
        elements.closeScheduleSettingsBtn.addEventListener('click', function () {
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
    
    if (elements.applyScheduleBtn) {
        elements.applyScheduleBtn.addEventListener('click', function () {
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
    
    if (elements.addSpecialistsModal) {
        elements.addSpecialistsModal.addEventListener('show.bs.modal', function () {
            // Загружаем расписания при открытии модального окна
            elements.specialistsList.innerHTML = '';
            fetch('/get_schedules/')
                .then(response => response.json())
                .then(data => {
                    elements.selectSchedule.innerHTML = '<option value="" disabled selected>Select a schedule</option>';
                    data.schedules.forEach(schedule => {
                        const option = document.createElement('option');
                        option.value = schedule.id;
                        option.textContent = schedule.name;
                        elements.selectSchedule.appendChild(option);
                    });
                })
                .catch(error => console.error('Error fetching schedules:', error));
        });
    
        // Обработка выбора расписания
        if (elements.selectSchedule) {
            elements.selectSchedule.addEventListener('change', function () {
                const scheduleId = parseInt(elements.selectSchedule.value);
                console.log('Selected Schedule ID:', scheduleId);
    
                // Сбрасываем список специалистов при изменении расписания
                elements.specialistsList.innerHTML = '';
    
                fetch('/get_specialists_for_assignment/')
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.error('Error fetching specialists:', data.error);
                        } else {
                            data.specialists.forEach(specialist => {
                                console.log('Specialist:', specialist.name);
                                console.log('Current Schedules:', specialist.current_schedules);
    
                                const listItem = document.createElement('li');
                                listItem.classList.add('list-group-item');
    
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.value = specialist.uuid;
    
                                // Проверяем, применено ли текущее расписание к специалисту
                                const isCurrentScheduleAssigned = specialist.current_schedules.some(schedule => schedule.id === scheduleId);
                                console.log(`Is Current Schedule Assigned to ${specialist.name}:`, isCurrentScheduleAssigned);
    
                                if (isCurrentScheduleAssigned) {
                                    checkbox.checked = true; // Устанавливаем метку выбора
                                    checkbox.disabled = false; // Снимаем блокировку
                                } else if (specialist.current_schedules.length > 0) {
                                    checkbox.disabled = true; // Блокируем выбор, если у специалиста уже есть другое расписание
                                }
    
                                const label = document.createElement('label');
                                label.textContent = specialist.name + (specialist.current_schedules.length > 0 ? ` (Current: ${specialist.current_schedules.map(s => s.name).join(', ')})` : '');
    
                                listItem.appendChild(checkbox);
                                listItem.appendChild(label);
                                elements.specialistsList.appendChild(listItem);
                            });
    
                            // Активируем кнопку назначения специалистов, если есть выбранное расписание
                            elements.assignSpecialistsBtn.disabled = false;
                        }
                    })
                    .catch(error => console.error('Error fetching specialists:', error));
            });
        }
    }
    
    if (elements.assignSpecialistsBtn) {
        elements.assignSpecialistsBtn.addEventListener('click', function () {
            const selectedSpecialists = Array.from(elements.specialistsList.querySelectorAll('input[type="checkbox"]'))
                .map(checkbox => ({
                    uuid: checkbox.value,
                    checked: checkbox.checked
                }));
    
            const scheduleId = elements.selectSchedule.value;
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
            const specialistsToAdd = selectedSpecialists.filter(s => s.checked).map(s => s.uuid);
            const specialistsToRemove = selectedSpecialists.filter(s => !s.checked).map(s => s.uuid);
    
            // Добавление специалистов к расписанию
            if (specialistsToAdd.length > 0) {
                fetch('/assign_specialists_to_schedule/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        schedule_id: scheduleId,
                        specialist_ids: specialistsToAdd
                    })
                })
                .then(response => response.json())
                .then(data => {
                    updateSchedules();
                    if (!data.success) {
                        alert(`Error assigning specialists: ${data.error}`);
                    }
                })
                .catch(error => {
                    console.error('Error assigning specialists:', error);
                    alert('Error assigning specialists.');
                });
            }
    
            // Удаление специалистов из расписания
            if (specialistsToRemove.length > 0) {
                fetch('/remove_specialists_from_schedule/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify({
                        schedule_id: scheduleId,
                        specialist_ids: specialistsToRemove
                    })
                })
                .then(response => response.json())
                .then(data => {
                    updateSchedules();
                    if (!data.success) {
                        alert(`Error removing specialists: ${data.error}`);
                    }
                })
                .catch(error => {
                    console.error('Error removing specialists:', error);
                    alert('Error removing specialists.');
                });
            }
    
            // Закрытие модального окна и обновление UI
            if (specialistsToAdd.length > 0 || specialistsToRemove.length > 0) {
                const addSpecialistsModal = bootstrap.Modal.getInstance(elements.addSpecialistsModal);
                addSpecialistsModal.hide();
                updateSchedules();
            }
        });
    }

    // Открытие модального окна для удаления расписания
    if (elements.deleteScheduleModal) {
        elements.deleteScheduleModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget; // Кнопка, вызвавшая модальное окно
            const scheduleId = button.getAttribute('data-schedule-id'); // Получаем ID расписания из кнопки
            console.log('Received schedule Id:', scheduleId);

            if (scheduleId) {
                fetch(`/get_schedule_specialists/${scheduleId}/`)
                    .then(response => {
                        if (!response.ok) {
                            console.error(`Server returned ${response.status} for ${response.url}`);
                            return response.text();
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (typeof data === 'string') {
                            console.error('Received HTML instead of JSON:', data);
                        } else {
                            if (data.specialists.length > 0) {
                                const specialistNames = data.specialists.map(specialist => specialist.name).join(', ');
                                elements.deleteScheduleWarning.textContent = `The schedule is currently assigned to the following specialists: ${specialistNames}. They will lose this schedule. Do you want to proceed?`;
                            } else {
                                elements.deleteScheduleWarning.textContent = "Are you sure you want to delete this schedule?";
                            }

                            // Устанавливаем ID расписания для кнопки подтверждения удаления
                            elements.confirmDeleteScheduleBtn.setAttribute('data-schedule-id', scheduleId);
                        }
                    })
                    .catch(error => console.error('Error fetching schedule specialists:', error));
            }
        });
    }

    // Подтверждение удаления расписания
    if (elements.confirmDeleteScheduleBtn) {
        elements.confirmDeleteScheduleBtn.addEventListener('click', function () {
            const scheduleId = this.getAttribute('data-schedule-id'); // Получаем ID расписания из кнопки
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            console.log('Delete schedule Id:', scheduleId);

            if (scheduleId) {
                fetch(`/delete_schedule/${scheduleId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const deleteScheduleModalInstance = bootstrap.Modal.getInstance(elements.deleteScheduleModal);
                        if (deleteScheduleModalInstance) {
                            deleteScheduleModalInstance.hide();
                        }
                        updateSchedules(); // Обновляем список расписаний
                    } else {
                        alert(`Error deleting schedule: ${data.error}`);
                    }
                })
                .catch(error => {
                    console.error('Error deleting schedule:', error);
                    alert('Error deleting schedule.');
                });
            } else {
                console.error('Schedule ID is null. Cannot delete schedule.');
            }
        });
    }
    
});