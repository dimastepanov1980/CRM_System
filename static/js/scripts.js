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
                        const specialistDetailContainer = document.getElementById('specialist-detail-container');
                        specialistDetailContainer.innerHTML = `
                            <h2>${data.name}</h2>
                            <p><strong>Specialization:</strong> ${data.specialization}</p>
                            <p><strong>Description:</strong> ${data.description}</p>
                            <p><strong>Experience:</strong> ${data.experience} years</p>
                        
                        `;
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
});

window.addEventListener('DOMContentLoaded', event => {
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }
});

  $(document).ready(function () {
           var calendar = $('#calendar').fullCalendar({
               header: {
                   left: 'prev,next today',
                   center: 'title',
                   right: 'month,agendaWeek,agendaDay'
               },
               events: '/all_events',
               selectable: true,
               selectHelper: true,
               editable: true,
               eventLimit: true,
               select: function (start, end, allDay) {
                   var title = prompt("Enter Event Title");
                   if (title) {
                       var start = $.fullCalendar.formatDate(start, "Y-MM-DD HH:mm:ss");
                       var end = $.fullCalendar.formatDate(end, "Y-MM-DD HH:mm:ss"); 
                       $.ajax({
                           type: "GET",
                           url: '/add_event',
                           data: {'title': title, 'start': start, 'end': end},
                           dataType: "json",
                           success: function (data) {
                               calendar.fullCalendar('refetchEvents');
                               alert("Added Successfully");
                           },
                           error: function (data) {
                               alert('There is a problem!!!');
                           }
                       });
                   }
               },
               eventResize: function (event) {
                   var start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
                   var end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
                   var title = event.title;
                   var id = event.id;
                   $.ajax({
                       type: "GET",
                       url: '/update',
                       data: {'title': title, 'start': start, 'end': end, 'id': id},
                       dataType: "json",
                       success: function (data) {
                           calendar.fullCalendar('refetchEvents');
                           alert('Event Update');
                       },
                       error: function (data) {
                           alert('There is a problem!!!');
                       }
                   });
               },
     
               eventDrop: function (event) {
                   var start = $.fullCalendar.formatDate(event.start, "Y-MM-DD HH:mm:ss");
                   var end = $.fullCalendar.formatDate(event.end, "Y-MM-DD HH:mm:ss");
                   var title = event.title;
                   var id = event.id;
                   $.ajax({
                       type: "GET",
                       url: '/update',
                       data: {'title': title, 'start': start, 'end': end, 'id': id},
                       dataType: "json",
                       success: function (data) {
                           calendar.fullCalendar('refetchEvents');
                           alert('Event Update');
                       },
                       error: function (data) {
                           alert('There is a problem!!!');
                       }
                   });
               },
     
               eventClick: function (event) {
                   if (confirm("Are you sure you want to remove it?")) {
                       var id = event.id;
                       $.ajax({
                           type: "GET",
                           url: '/remove',
                           data: {'id': id},
                           dataType: "json",
                           success: function (data) {
                               calendar.fullCalendar('refetchEvents');
                               alert('Event Removed');
                           },
                           error: function (data) {
                               alert('There is a problem!!!');
                           }
                       });
                   }
               },
     
           });
       });
     