document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Логика для добавления категории услуг
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
    
    // Логика для редактирования категроии
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

   // Логика для добавления услуги
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


    // Логика для редактирования услуги
   const editServiceForm = document.getElementById('editServiceForm');
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
                   alert('Service updated successfully');
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
    
   // Логика для закрытия модальных окон при добавлении услуг
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
// Логика для удаления категории услуги
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

// Логика для редактирования услуги
function editService(serviceId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    fetch(`/edit_service/${serviceId}/`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
    .then(response => response.text())
    .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const form = tempDiv.querySelector('form');
        const modalBody = document.getElementById('editServiceModalBody');
        if (modalBody && form) {
            modalBody.innerHTML = form.outerHTML; // Вставляем полную форму

            // Установите атрибут data-service-id
            const editServiceForm = document.getElementById('editServiceForm');
            if (editServiceForm) {
                editServiceForm.setAttribute('data-service-id', serviceId);

                // Добавляем обработчик события для сохранения изменений
                editServiceForm.addEventListener('submit', function (event) {
                    event.preventDefault();
                    const formData = new FormData(editServiceForm);

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
                            alert('Service updated successfully');
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
            } else {
                console.error('Error: editServiceForm not found after inserting HTML');
            }

            new bootstrap.Modal(document.getElementById('editServiceModal')).show();
        } else {
            console.error('Error: modalBody or form not found');
        }
    })
    .catch(error => console.error('Error fetching service:', error));
}

// Логика для удаления услуги
function deleteService(serviceId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    if (confirm('Are you sure you want to delete this service?')) {
        fetch(`/delete_service/${serviceId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Service deleted successfully');
                location.reload();
            } else {
                console.error('Error delete Service:', error);
                alert('Error: ' + data.errors);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem deleting the service.');
        });
    }
}