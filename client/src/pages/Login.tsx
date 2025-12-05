import React, { useEffect } from 'react';

// Объявляем глобальную функцию, чтобы TypeScript не ругался
declare global {
  interface Window { 
    onTelegramAuth: (user: any) => void;
  }
}

const LoginPage = () => {
  useEffect(() => {
    // Создаем callback-функцию
    window.onTelegramAuth = async (user) => {
      try {
        const response = await fetch('/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        const data = await response.json();

        if (data.success) {
          window.location.href = '/editor'; // Перенаправляем на главную страницу
        } else {
          alert('Telegram authentication failed: ' + data.message);
        }
      } catch (error) {
        console.error('Telegram auth request failed:', error);
        alert('An error occurred during login.');
      }
    };

    // Динамически добавляем скрипт Telegram
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'ai_photo_editor_auth_bot' ); // ВАШ BOT USERNAME
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    document.getElementById('telegram-login-button-container')?.appendChild(script);

    return () => {
      // Очистка при размонтировании компонента
      const container = document.getElementById('telegram-login-button-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px' }}>
      
      {/* Кнопка Google */}
      <a href="/auth/google" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 30px', fontSize: '18px' }}>
          Войти через Google
        </button>
      </a>

      {/* Контейнер для кнопки Telegram */}
      <div id="telegram-login-button-container"></div>

    </div>
  );
};

export default LoginPage;
