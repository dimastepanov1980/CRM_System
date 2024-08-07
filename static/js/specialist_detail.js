document.addEventListener('DOMContentLoaded', function() {
    const csrftoken = document.getElementById('csrf-token').value;
    const specialistId = document.getElementById('specialist-id').value;

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
                var title = prompt("Enter Event Title");
                if (title) {
                    fetch('/add_event/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({'title': title, 'start': start, 'end': end, 'specialist_id': specialistId})
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            calendar.refetchEvents(); // Обновление событий после добавления
                        } else {
                            alert('Error: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error adding event:', error);
                        alert('There is a problem!!!');
                    });
                }
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