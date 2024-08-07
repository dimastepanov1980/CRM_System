document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // Логика для добавления категории услуг
    const addServiceCategoryForm = document.getElementById('addServiceCategoryForm');
    if (addServiceCategoryForm) {
        addServiceCategoryForm.addEventListener('submit', function (event) {
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
                    const newCategory = data.category;
                    const categoryList = document.getElementById('servicesAccordion');
                    const newCategoryHtml = `
                        <div class="accordion-item">
                            <h2 class="accordion-header d-flex justify-content-between align-items-center" id="heading${newCategory.id}">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${newCategory.id}" aria-expanded="true" aria-controls="collapse${newCategory.id}">
                                    ${newCategory.name}
                                </button>
                                <div class="dropdown">
                                    <button class="btn btn-link dropdown-toggle" type="button" id="dropdownMenuButton${newCategory.id}" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${newCategory.id}">
                                        <li><a class="dropdown-item" href="#" onclick="editCategory(${newCategory.id})">Edit</a></li>
                                        <li><a class="dropdown-item" href="#" onclick="deleteCategory(${newCategory.id})">Delete</a></li>
                                    </ul>
                                </div>
                            </h2>
                            <div id="collapse${newCategory.id}" class="accordion-collapse collapse" aria-labelledby="heading${newCategory.id}" data-bs-parent="#servicesAccordion">
                                <div class="accordion-body">
                                    <table class="table table-sm table-striped">
                                        <thead>
                                            <tr>
                                                <th style="width: 1%">#</th>
                                                <th style="width: 30%">Service Name</th>
                                                <th style="width: 30%">Description</th>
                                                <th style="width: 20%">Duration</th>
                                                <th style="width: 10%">Price</th>
                                                <th style="width: 20%">Specialists</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Список услуг для этой категории -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                    categoryList.insertAdjacentHTML('beforeend', newCategoryHtml);
                    const addServiceCategoryModal = bootstrap.Modal.getInstance(document.getElementById('addServiceCategoryModal'));
                    addServiceCategoryModal.hide();
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
                    'X-CSRFToken': csrfToken
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

    // Логика для редактирования услуги
    const editServiceModal = new bootstrap.Modal(document.getElementById('editServiceModal'));
    const editServiceForm = document.getElementById('editServiceForm');

    function editService(serviceId) {
        fetch(`/edit_service/${serviceId}/`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('editServiceModalBody').innerHTML = data.form_html;
            editServiceModal.show();
        });
    }

    if (editServiceForm) {
        editServiceForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(editServiceForm);
            const serviceId = editServiceForm.getAttribute('data-service-id');

            fetch(`/edit_service/${serviceId}/`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken,
                },
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Error: ' + JSON.stringify(data.errors));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was a problem editing the service.');
            });
        });
    }

    // Логика для удаления услуги
    function deleteService(serviceId) {
        if (confirm('Are you sure you want to delete this service?')) {
            fetch(`/delete_service/${serviceId}/`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken,
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was a problem deleting the service.');
            });
        }
    }

    // Привязка кнопок редактирования и удаления к функциям
    document.querySelectorAll('.edit-service-btn').forEach(button => {
        button.addEventListener('click', function () {
            const serviceId = this.getAttribute('data-service-id');
            editService(serviceId);
        });
    });

    document.querySelectorAll('.delete-service-btn').forEach(button => {
        button.addEventListener('click', function () {
            const serviceId = this.getAttribute('data-service-id');
            deleteService(serviceId);
        });
    });
});


// Функции для открытия модальных окон редактирования и удаления категории
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

function deleteCategory(categoryId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    if (confirm('Are you sure you want to delete this category?')) {
        fetch(`/delete_category/${categoryId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();  // Перезагрузка страницы для обновления данных
            } else {
                alert('Error: ' + data.errors);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem deleting the category.');
        });
    }
}