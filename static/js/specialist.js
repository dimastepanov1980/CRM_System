document.addEventListener('DOMContentLoaded', function() {
    const csrftoken = document.getElementById('csrf-token').value;
    const specialistId = document.getElementById('specialist-id').value;

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

    // Логика для добавления евента в календарь специаилста
    function updateCalendar(specialistId) {
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
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
                        services.forEach(service => {
                            let option = document.createElement('option');
                            option.value = service.id;
                            option.textContent = service.name;
                            select.appendChild(option);
                        });
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

                // Обработка добавления события при нажатии на кнопку "Добавить событие"
                document.getElementById('addEventBtn').onclick = function() {
                    var selectedService = document.getElementById('serviceSelect').value;
                    var title = document.getElementById('eventTitle').value;
                    var start = document.getElementById('eventStart').value;
                    var end = document.getElementById('eventEnd').value;
                
                    if (selectedService && title && start && end) {
                        fetch('/add_event/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken
                            },
                            body: JSON.stringify({
                                'title': title,
                                'start': start,
                                'end': end,
                                'specialist_id': specialistId,
                                'service_id': selectedService
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log('getting data from modal:',
                                'title', title,
                                'start', start,
                                'end', end,
                                'specialist_id', specialistId,
                                'service_id', selectedService);
                            if (data.success) {
                                calendar.refetchEvents(); // Обновление событий после добавления
                                eventModal.hide(); // Закрываем модальное окно после успешного добавления
                            } else {
                                console.error('Error add event:', data, data.error);
                                alert('Error: ' + data.error);
                            }
                        })
                        .catch(error => {
                            console.error('Error adding event:', error);
                            alert('There is a problem!!!');
                        });
                    } else {
                        alert('Please fill out all fields.');
                    }
                };
        
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
    updateCalendar(specialistId);
});