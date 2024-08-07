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
                    window.location.href = '/specialists/';
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

        

    });
    
   