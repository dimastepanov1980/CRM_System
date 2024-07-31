document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for collapse toggles
    const collapsibleLinks = document.querySelectorAll('[data-bs-toggle="collapse"]');
    collapsibleLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const targetId = this.getAttribute('href');
            if (targetId) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    collapsibleLinks.forEach(otherLink => {
                        const otherTargetId = otherLink.getAttribute('href');
                        if (otherTargetId && otherTargetId !== targetId) {
                            const otherTargetElement = document.querySelector(otherTargetId);
                            if (otherTargetElement && otherTargetElement.classList.contains('show')) {
                                new bootstrap.Collapse(otherTargetElement, {
                                    toggle: true
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    

    // Add new specialist
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
                    window.location.href = '/specialist_list/';
                } else {
                    // Handle form errors
                    alert('There was an error adding the specialist.');
                }
            })
            .catch(error => console.error('Error:', error));
        });
    }

    // Обработчик для ссылок категорий
    const categoryLinks = document.querySelectorAll('.category-link');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const categoryId = this.getAttribute('data-category');
            const serviceItems = document.querySelectorAll('.service-item');
            serviceItems.forEach(item => {
                if (categoryId === 'all' || item.getAttribute('data-category') === categoryId) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    const closeCategoryModalButton = document.getElementById('closeCategoryModal');
    if (closeCategoryModalButton) {
        closeCategoryModalButton.addEventListener('click', function() {
            // Закрытие модального окна Add Service Category
            const addServiceCategoryModal = document.getElementById('addServiceCategoryModal');
            const modalInstance = bootstrap.Modal.getInstance(addServiceCategoryModal);
            modalInstance.hide();

            // Открытие модального окна Add Service
            const addServiceModal = new bootstrap.Modal(document.getElementById('addServiceModal'));
            addServiceModal.show();
        });
    }

    const addServiceCategoryForm = document.getElementById('addServiceCategoryForm');
    if (addServiceCategoryForm) {
        addServiceCategoryForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Обновление списка категорий в форме добавления услуги
                    const categorySelect = document.getElementById('id_category'); // Замените на правильный ID, если нужно
                    categorySelect.innerHTML = ''; // Очистка текущих опций
                    data.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        categorySelect.appendChild(option);
                    });

                    // Закрытие модального окна "Add Service Category"
                    const addServiceCategoryModal = document.getElementById('addServiceCategoryModal');
                    const modal = bootstrap.Modal.getInstance(addServiceCategoryModal);
                    modal.hide();
   
                    // Открытие модального окна Add Service
                    const addServiceModal = new bootstrap.Modal(document.getElementById('addServiceModal'));
                    addServiceModal.show();

                    alert('Service category added successfully');
                } else {
                    alert('Error: ' + data.errors);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was a problem adding the service category.');
            });
        });
    }
    
    const addServiceForm = document.getElementById('addServiceForm');
    if (addServiceForm) {
        addServiceForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Service added successfully');
                    location.reload();
                } else {
                    alert('Error: ' + data.errors);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was a problem adding the service.');
            });
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
    
        const specialistList = document.getElementById('specialist-list');
        const urlParams = new URLSearchParams(window.location.search);
        const uuid = urlParams.get('uuid');
    
        if (uuid) {
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
                        <input type="hidden" id="specialist-id" value="${data.specialist_id}">
                    `;
                    updateCalendar(data.events, data.specialist_id);
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                    alert('Failed to fetch specialist details. Please try again later.');
                });
        }
        
        
        const editCategoryForm = document.getElementById('editCategoryForm');
        if (editCategoryForm) {
            editCategoryForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const form = event.target;
                const categoryId = document.getElementById('editCategoryId').value;
                const formData = new FormData(form);
            
                fetch(`/edit_category/${categoryId}/`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': document.getElementById('csrf-token').value
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Category updated successfully');
                        location.reload();
                    } else {
                        alert('Error: ' + JSON.stringify(data.errors));
                    }
                })
                .catch(error => {
                    console.error('Error updating category:', error);
                    alert('There was a problem updating the category.');
                });
            });
        }

    });
    
    function updateCalendar(events, specialistId) {
        const csrftoken = document.getElementById('csrf-token').value;
        console.log('Initializing calendar with events, ID:', events, 'and csrf-token', csrftoken); // Отладочное сообщение
        var calendarEl = document.getElementById('calendar');
        
        var calendar = new FullCalendar.Calendar(calendarEl, {
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events,
            selectable: true,
            editable: true,
            select: function({ start, end, allDay }) {
                var title = prompt("Enter Event Title");
                console.log('Select event triggered, specialistId', specialistId); // Отладочное сообщение
    
                console.log('Entered title:', title); // Отладочное сообщение
                if (title) {
                    console.log('Adding event with title:', title, 'start:', start, 'end:', end, 'specialistId:', specialistId, 'csrf-token', csrftoken); // Отладочное сообщение
    
                    fetch('/add_event/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken // Добавление CSRF-токена в заголовок
                        },
                        body: JSON.stringify({'title': title, 'start': start, 'end': end, 'specialist_id': specialistId})
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
                            calendar.refetchEvents(); // Перезагрузка событий в календаре
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
                    calendar.refetchEvents(); // Перезагрузка событий в календаре
                    alert('Event Update');
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
                    calendar.refetchEvents(); // Перезагрузка событий в календаре
                    alert('Event Update');
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
                        calendar.refetchEvents(); // Перезагрузка событий в календаре
                        alert('Event Removed');
                    })
                    .catch(error => {
                        console.error('Error removing event:', error); // Отладочное сообщение
                        alert('There is a problem!!!');
                    });
                }
            }
        });
    
        calendar.render();
    }

    function deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category?')) {
            fetch(`/delete_category/${categoryId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': document.getElementById('csrf-token').value
                }
            })
            .then(response => {
                if (response.ok) {
                    location.reload();
                } else {
                    alert('Failed to delete category.');
                }
            })
            .catch(error => console.error('Error deleting category:', error));
        }
    }

    function editCategory(categoryId) {
        fetch(`/edit_category/${categoryId}/`)
            .then(response => response.text())  // Ожидание HTML, а не JSON
            .then(html => {
                // Создание временного элемента для хранения полученного HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
    
                // Получение данных из HTML
                const name = tempDiv.querySelector('#editCategoryName').value;
                const description = tempDiv.querySelector('#editCategoryDescription').value;
                const id = tempDiv.querySelector('#editCategoryId').value;
    
                // Обновление формы в текущем документе
                document.getElementById('editCategoryName').value = name;
                document.getElementById('editCategoryDescription').value = description;
                document.getElementById('editCategoryId').value = id;
    
                // Показ модального окна
                new bootstrap.Modal(document.getElementById('editCategoryModal')).show();
            })
            .catch(error => console.error('Error fetching category:', error));
    }