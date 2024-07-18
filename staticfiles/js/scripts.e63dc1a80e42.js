document.addEventListener('DOMContentLoaded', function() {
    const specialistList = document.getElementById('specialist-list');
    if (specialistList) {
        specialistList.addEventListener('click', function(event) {
            if (event.target.classList.contains('view-schedule-link')) {
                event.preventDefault();
                const uuid = event.target.getAttribute('data-uuid');
                console.log(`Fetching details for specialist with UUID: ${uuid}`); // Отладочное сообщение
                
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
                            <h3>Schedule</h3>
                            <ul>
                                ${data.schedule.map(item => `<li>${item.date} - ${item.time}</li>`).join('')}
                            </ul>
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
                    const specialistList = document.getElementById('specialist-list');
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