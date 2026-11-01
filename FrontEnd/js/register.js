import { register, isAuthenticated, getCountries } from './api/auth.js';

if (isAuthenticated()) {
  window.location.href = './index-logged.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const registerForm = document.querySelector('#registerForm');
  const firstNameInput = document.querySelector('#firstName');
  const lastNameInput = document.querySelector('#lastName');
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#password');
  const confirmPasswordInput = document.querySelector('#confirmPassword');
  const countrySelect = document.querySelector('#country');
  const errorMessage = document.querySelector('#errorMessage');
  const successMessage = document.querySelector('#successMessage');
  const submitButton = document.querySelector('#submitButton');

  if (!registerForm) {
    console.error('No se encontró el formulario de registro');
    return;
  }

  try {
    const countries = await getCountries();
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.id;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar países:', error);
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (errorMessage) {
      errorMessage.textContent = '';
      errorMessage.classList.add('hidden');
    }
    if (successMessage) {
      successMessage.textContent = '';
      successMessage.classList.add('hidden');
    }

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : password;
    const countryId = countrySelect.value ? parseInt(countrySelect.value) : null;

    if (!firstName || !lastName || !email || !password) {
      showError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (confirmPasswordInput && password !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Registrando...';
    }

    try {
      const data = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        country_id: countryId,
      });

      console.log('Registro exitoso:', data);
      const isActive = data.user && data.user.is_active;
      showSuccess(isActive
        ? '¡Registro exitoso! Ya puedes iniciar sesión.'
        : '¡Registro exitoso! Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');

      registerForm.reset();

      setTimeout(() => {
        window.location.href = './login.html';
      }, isActive ? 2000 : 5000);
    } catch (error) {
      showError(error.message || 'Error al registrarse');

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Crear Cuenta';
      }
    }
  });

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    } else {
      console.error('Error:', message);
    }
  }

  function showSuccess(message) {
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.classList.remove('hidden');
    } else {
      console.log('Success:', message);
    }
  }
});
