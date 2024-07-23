document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for collapse toggles
    const collapsibleLinks = document.querySelectorAll('[data-bs-toggle="collapse"]');
    collapsibleLinks.forEach(link => {
        link.addEventListener('click', function() {
            const targetId = this.getAttribute('href').substring(1);
            collapsibleLinks.forEach(otherLink => {
                const otherTargetId = otherLink.getAttribute('href').substring(1);
                if (otherTargetId !== targetId) {
                    const otherTarget = document.getElementById(otherTargetId);
                    if (otherTarget.classList.contains('show')) {
                        new bootstrap.Collapse(otherTarget, {
                            toggle: true
                        });
                    }
                }
            });
        });
    });

    const specialistList = document.getElementById('specialist-list');
    if (specialistList) {
        specialistList.addEventListener('click', function(event) {
            if (event.target.classList.contains('view-schedule-link')) {
                event.preventDefault();
                const uuid = event.target.getAttribute('data-uuid');
                console.log(`Fetching details for specialist with UUID: ${uuid}`);
                
                fetch(`/specialist/${uuid}/detail/`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Specialist details:', data); // Отладочное сообщение
                        console.log('Calendar ID:', data.calendar_id); // Отладочное сообщение

                        const specialistDetailContainer = document.getElementById('specialist-detail-container');
                        specialistDetailContainer.innerHTML = `
                            <h2>${data.name}</h2>
                            <p><strong>Specialization:</strong> ${data.specialization}</p>
                            <p><strong>Description:</strong> ${data.description}</p>
                            <p><strong>Experience:</strong> ${data.experience} years</p>
                        `;
                        // Update calendar events
                        updateCalendar(data.events, data.calendar_id);
                    })
                    .catch(error => {
                        console.error('There was a problem with the fetch operation:', error);
                        alert('Failed to fetch specialist details. Please try again later.');
                    });
            }
        });
    }

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
                console.log('Add specialist response:', data); // Отладочное сообщение
                if (data.success) {
                    // Add new specialist to the list
                    const newSpecialist = document.createElement('li');
                    newSpecialist.className = 'list-group-item';
                    newSpecialist.innerHTML = `
                        <a href="#" class="view-schedule-link" data-uuid="${data.specialist.uuid}">
                            ${data.specialist.name} - ${data.specialist.specialization}
                        </a>
                    `;
                    specialistList.appendChild(newSpecialist);

                    // Close the modal
                    const addSpecialistModal = document.getElementById('addSpecialistModal');
                    const modal = bootstrap.Modal.getInstance(addSpecialistModal);
                    modal.hide();

                    // Reset the form
                    addSpecialistForm.reset();
                } else {
                    // Handle form errors
                    alert('There was an error adding the specialist.');
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }

    const calendarEl = document.getElementById('calendar');
    const csrftoken = document.getElementById('csrf-token').value;

    function updateCalendar(events) {
        console.log('Initializing calendar with events:', events); // Отладочное сообщение

        $('#calendar').fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek,agendaDay'
            },
            events: events,
            selectable: true,
            selectHelper: true,
            editable: true,
            eventLimit: true,
            select: function(start, end, allDay) {
                console.log('Select event triggered'); // Отладочное сообщение
                var title = prompt("Enter Event Title");
                console.log('Entered title:', title); // Отладочное сообщение
                if (title) {
                    var startIso = start.toISOString();
                    var endIso = end.toISOString();
                    console.log('Adding event with title:', title, 'start:', startIso, 'end:', endIso); // Отладочное сообщение

                    fetch('/add_event/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken // Добавление CSRF-токена в заголовок
                        },
                        body: JSON.stringify({'title': title, 'start': startIso, 'end': endIso})
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Add event response:', data); // Отладочное сообщение
                        if (data.success) {
                            $('#calendar').fullCalendar('refetchEvents'); // Перезагрузка событий в календаре
                            alert("Added Successfully");
                        } else {
                            alert('Error: ' + data.error);
                        }
                    })
                    .catch(error => {
                        console.error('Error adding event:', error); // Отладочное сообщение
                        alert('There is a problem!!!');
                    });
                }
                console.log('No Adding the event:', title); // Отладочное сообщение
            },
            eventResize: function(event) {
                var start = event.start.toISOString();
                var end = event.end.toISOString();
                var title = event.title;
                var id = event.id;
                console.log('Resizing event with id:', id, 'title:', title, 'start:', start, 'end:', end); // Отладочное сообщение
                
                fetch('/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({'title': title, 'start': start, 'end': end, 'id': id})
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Update event response:', data); // Отладочное сообщение
                    $('#calendar').fullCalendar('refetchEvents');
                    alert('Event Updated');
                })
                .catch(error => {
                    console.error('Error updating event:', error); // Отладочное сообщение
                    alert('There is a problem!!!');
                });
            },
            eventDrop: function(event) {
                var start = event.start.toISOString();
                var end = event.end.toISOString();
                var title = event.title;
                var id = event.id;
                console.log('Dropping event with id:', id, 'title:', title, 'start:', start, 'end:', end); // Отладочное сообщение
                
                fetch('/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({'title': title, 'start': start, 'end': end, 'id': id})
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Update event response:', data); // Отладочное сообщение
                    $('#calendar').fullCalendar('refetchEvents');
                    alert('Event Updated');
                })
                .catch(error => {
                    console.error('Error updating event:', error); // Отладочное сообщение
                    alert('There is a problem!!!');
                });
            },
            eventClick: function(event) {
                if (confirm("Are you sure you want to remove it?")) {
                    var id = event.id;
                    console.log('Removing event with id:', id); // Отладочное сообщение
                    
                    fetch('/remove', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({'id': id})
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Remove event response:', data); // Отладочное сообщение
                        $('#calendar').fullCalendar('refetchEvents');
                        alert('Event Removed');
                    })
                    .catch(error => {
                        console.error('Error removing event:', error); // Отладочное сообщение
                        alert('There is a problem!!!');
                    });
                }
            }
        });

        $('#calendar').fullCalendar('refetchEvents');
    }

    fetch('/all_events/')
        .then(response => response.json())
        .then(events => {
            updateCalendar(events);
        })
        .catch(error => {
            console.error('Error fetching events:', error); // Отладочное сообщение
        });
});


