document.addEventListener('DOMContentLoaded', function() {
    const csrftoken = document.getElementById('csrf-token').value;
    const specialistId = document.getElementById('specialist-id').value;

    const scheduleDataElement = document.getElementById('schedule-data');
    let schedule_data = [];

    if (scheduleDataElement) {
        try {
            // Получаем текстовое содержание внутри тега <script>
            const jsonData = scheduleDataElement.textContent.trim();
            console.log('Полученные данные расписания:', jsonData);

            // Парсим JSON-строку
            schedule_data = JSON.parse(jsonData);

        } catch (error) {
            console.error("Ошибка разбора JSON: ", error);
        }
    } else {
        console.warn("Элемент с расписанием не найден.");
    }

    console.log('Полученные данные расписания:', schedule_data);




     // Логика для добавления евента в календарь специаилста
     function updateCalendar(specialistId, schedule) {
        console.log('Getting schedule Object:', schedule);
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            initialView: 'timeGridWeek',
            businessHours: schedule,
            events: function(fetchInfo, successCallback, failureCallback) {
                fetch(`/specialist/${specialistId}/events/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                })
                .then(response => response.json())
                .then(data => {
                    successCallback(data.events);
                })
                .catch(error => {
                    console.error('Error loading events:', error);
                    failureCallback(error);
                });
            },
            selectable: true,
            editable: true,
            select: function({ start, end, allDay }) {
                // Запрос на получение доступных услуг для данного специалиста
                fetch(`/specialist/${specialistId}/available_services/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Обработка полученного списка услуг
                        let services = data.services;
                        let select = document.getElementById('serviceSelect');
                        select.innerHTML = ''; // Очищаем существующие опции

                         // Добавляем пустую опцию
                        let emptyOption = document.createElement('option');
                        emptyOption.value = '';
                        emptyOption.textContent = 'Select Service';
                        select.appendChild(emptyOption);
                        
                        services.forEach(service => {
                            let option = document.createElement('option');
                            option.value = service.id;
                            option.textContent = service.name;
                            select.appendChild(option);
                        });
            
                        let selectedServiceDuration = 0;
                        let selectedServiceName = "";
                        select.addEventListener('change', function() {
                            const selectedServiceId = this.value;
                            const selectedService = services.find(service => service.id == selectedServiceId);
                            if (selectedService) {
                                selectedServiceDuration = selectedService.duration;
                                selectedServiceName = selectedService.name;
                                console.log('Selected Service Object:', selectedService); // Выводим весь объект для отладки
                                console.log('Selected Service Duration:', selectedService.duration);
                                console.log('Selected Service Name:', selectedService.name);
                            }
                        });
            
                        document.getElementById('addEventBtn').onclick = function() {
                            var selectedServiceId = document.getElementById('serviceSelect').value;
                            var start = document.getElementById('eventStart').value;
                        
                            if (selectedServiceId === '' || start === '') {
                                alert('Please fill out all fields.');
                                return;
                            }
                        
                            // Преобразование времени в UTC перед отправкой на сервер
                            var startTime = new Date(start);
                            var startUTC = startTime.toISOString();  // Преобразуем время в ISO-формат UTC
                        
                            // Рассчитаем время окончания события на основе продолжительности услуги
                            var endTime = new Date(startTime.getTime() + selectedServiceDuration * 60000);
                            var endUTC = endTime.toISOString();  // Преобразуем время окончания в ISO-формат UTC
                        
                            console.log('Selected Service Duration after click Add:', selectedServiceDuration);
                            console.log('Calculated End Time in UTC:', endUTC);
                        
                            fetch('/add_event/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrftoken
                                },
                                body: JSON.stringify({
                                    'title': selectedServiceName,
                                    'start': startUTC,  // Отправляем время начала в формате UTC
                                    'end': endUTC,  // Отправляем время окончания в формате UTC
                                    'specialist_id': specialistId,
                                    'service_id': selectedServiceId
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                console.log('getting data from modal:',
                                    'title', selectedServiceName,
                                    'start', startUTC,
                                    'end', endUTC,
                                    'specialist_id', specialistId,
                                    'service_id', selectedServiceId);
                                if (data.success) {
                                    calendar.refetchEvents(); // Обновление событий после добавления
                                    eventModal.hide(); // Закрываем модальное окно после успешного добавления
                                    document.getElementById('serviceSelect').value = '';
                                    document.getElementById('eventTitle').value = '';
                                    document.getElementById('eventStart').value = '';
                                } else {
                                    console.error('Error add event:', data, data.error);
                                    alert('Error: ' + data.error);
                                }
                            })
                            .catch(error => {
                                console.error('Error adding event:', error);
                                alert('There is a problem!!!');
                            });
                        };
                    } else {
                        console.error('Error:', data.error);
                        alert('Error: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Error fetching services:', error);
                    alert('There was a problem fetching the services.');
                });
            
                // Открываем модальное окно
                var eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
                eventModal.show();
            },            
            eventResize: function(info) {
                var event = info.event;
                var start = event.start.toISOString();
                var end = event.end ? event.end.toISOString() : null;
                var title = event.title;
                var id = event.id;

                fetch('/update_event/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({'title': title, 'id': id, 'start': start, 'end': end, 'specialist_id': specialistId})
                })
                .then(response => response.json())
                .then(data => {
                    calendar.refetchEvents(); // Обновление событий после изменения
                })
                .catch(error => {
                    console.error('Error updating event:', error);
                    alert('There is a problem!!!');
                });
            },
            eventDrop: function(info) {
                var event = info.event;
                var start = event.start.toISOString();
                var end = event.end ? event.end.toISOString() : null;
                var title = event.title;
                var id = event.id;

                fetch('/update_event/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({'title': title, 'id': id, 'start': start, 'end': end, 'specialist_id': specialistId})
                })
                .then(response => response.json())
                .then(data => {
                    calendar.refetchEvents(); // Обновление событий после перемещения
                })
                .catch(error => {
                    console.error('Error updating event:', error);
                    alert('There is a problem!!!');
                });
            },
            eventClick: function(info) {
                var event = info.event;
                var start = event.start.toISOString();
                var end = event.end ? event.end.toISOString() : null;
                var title = event.title;
                var id = event.id;

                if (confirm("Are you sure you want to remove it?")) {
                    fetch('/remove_event/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({'title': title, 'id': id, 'start': start, 'end': end, 'specialist_id': specialistId})
                    })
                    .then(response => response.json())
                    .then(data => {
                        calendar.refetchEvents(); // Обновление событий после удаления
                    })
                    .catch(error => {
                        console.error('Error removing event:', error);
                        alert('There is a problem!!!');
                    });
                }
            }
        });
        calendar.render();
    }

    updateCalendar(specialistId, schedule_data);

    // Логика для добавления специаилста
    const addSpecialistForm = document.getElementById('addSpecialistForm');
    if (addSpecialistForm) {
        addSpecialistForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(addSpecialistForm);
            fetch(addSpecialistForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Add new specialist to the list
                    const newSpecialist = document.createElement('li');
                    newSpecialist.className = 'list-group-item';
                    newSpecialist.innerHTML = `
                        <a href="#" class="view-schedule-link" data-uuid="${data.specialist.uuid}">
                            ${data.specialist.name} - ${data.specialist.specialization}
                        </a>
                    `;
                    const specialistList = document.getElementById('specialist-list');
                    if (specialistList) {
                        specialistList.appendChild(newSpecialist);
                    }

                    // Close the modal
                    const addSpecialistModal = document.getElementById('addSpecialistModal');
                    const modal = bootstrap.Modal.getInstance(addSpecialistModal);
                    modal.hide();

                    // Reset the form
                    addSpecialistForm.reset();

                    // Redirect to specialist list
                    window.location.href = '/specialists/';
                } else {
                    // Handle form errors
                    alert('There was an error adding the specialist.');
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

   
});