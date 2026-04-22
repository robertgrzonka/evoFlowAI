import type { UiLocale } from '../ui-locale';

export const authPagesCopy: Record<
  UiLocale,
  {
    login: {
      backHome: string;
      title: string;
      subtitle: string;
      email: string;
      password: string;
      rememberMe: string;
      forgotPassword: string;
      submit: string;
      submitting: string;
      showPassword: string;
      hidePassword: string;
      noAccount: string;
      signUp: string;
      toastWelcomeTitle: string;
      toastWelcomeBody: string;
      toastLoginFailTitle: string;
      toastLoginFailBody: string;
    };
    register: {
      backHome: string;
      title: string;
      subtitle: string;
      namePlaceholder: string;
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      passwordHint: string;
      submit: string;
      submitting: string;
      showPassword: string;
      hidePassword: string;
      hasAccount: string;
      logIn: string;
      toastCreatedTitle: string;
      toastCreatedBody: string;
      toastRegisterFailTitle: string;
      toastRegisterFailBody: string;
      toastMismatchTitle: string;
      toastMismatchBody: string;
      toastShortPasswordTitle: string;
      toastShortPasswordBody: string;
    };
    forgot: {
      backLogin: string;
      title: string;
      subtitle: string;
      email: string;
      submit: string;
      submitting: string;
      toastResetTitle: string;
      toastFailTitle: string;
      toastFailBody: string;
      requestReceived: string;
      requestBody: string;
      resetLinkLabel: string;
      copyLink: string;
      openLink: string;
      linkUnavailable: string;
      remembered: string;
      logIn: string;
      toastCopiedTitle: string;
      toastCopiedBody: string;
      toastCopyFailTitle: string;
      toastCopyFailBody: string;
    };
    reset: {
      backLogin: string;
      title: string;
      subtitle: string;
      newPassword: string;
      confirmPassword: string;
      passwordHint: (min: number) => string;
      submit: string;
      submitting: string;
      showPassword: string;
      hidePassword: string;
      toastUpdatedTitle: string;
      toastUpdatedBody: string;
      toastFailTitle: string;
      toastFailBody: string;
      toastInvalidTitle: string;
      toastInvalidBody: string;
      toastShortTitle: string;
      toastShortBody: (min: number) => string;
      toastMismatchTitle: string;
      toastMismatchBody: string;
      missingTokenBody: string;
      newLinkCta: string;
    };
  }
> = {
  en: {
    login: {
      backHome: 'Back to home',
      title: 'Welcome back',
      subtitle: 'Log in to your account to continue',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      submit: 'Log in',
      submitting: 'Logging in...',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      toastWelcomeTitle: 'Welcome back!',
      toastWelcomeBody: 'You are now logged in to evoFlowAI.',
      toastLoginFailTitle: 'Login failed',
      toastLoginFailBody: 'Please check email and password.',
    },
    register: {
      backHome: 'Back to home',
      title: 'Create account',
      subtitle: 'Start your journey to better nutrition',
      namePlaceholder: 'John Doe',
      fullName: 'Full name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      passwordHint: 'At least 6 characters',
      submit: 'Create account',
      submitting: 'Creating account...',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      hasAccount: 'Already have an account?',
      logIn: 'Log in',
      toastCreatedTitle: 'Account created',
      toastCreatedBody: 'Welcome to evoFlowAI. Let us build your momentum.',
      toastRegisterFailTitle: 'Registration failed',
      toastRegisterFailBody: 'Could not create account.',
      toastMismatchTitle: 'Password mismatch',
      toastMismatchBody: 'Please make sure both password fields are identical.',
      toastShortPasswordTitle: 'Password too short',
      toastShortPasswordBody: 'Use at least 6 characters.',
    },
    forgot: {
      backLogin: 'Back to login',
      title: 'Reset your password',
      subtitle: 'Enter your account email and we will generate a local reset link for you.',
      email: 'Email',
      submit: 'Generate reset link',
      submitting: 'Generating link...',
      toastResetTitle: 'Reset link ready',
      toastFailTitle: 'Reset request failed',
      toastFailBody: 'Unable to start password reset.',
      requestReceived: 'Request received',
      requestBody:
        'If an account exists for {email}, you can continue with the link below.',
      resetLinkLabel: 'Local reset link',
      copyLink: 'Copy link',
      openLink: 'Open link',
      linkUnavailable: 'Local reset link is currently unavailable. Make sure backend local reset mode is enabled.',
      remembered: 'Remembered your password?',
      logIn: 'Log in',
      toastCopiedTitle: 'Copied',
      toastCopiedBody: 'Reset link copied to clipboard.',
      toastCopyFailTitle: 'Copy failed',
      toastCopyFailBody: 'Unable to copy reset link.',
    },
    reset: {
      backLogin: 'Back to login',
      title: 'Choose a new password',
      subtitle: 'Set a new password for your account and continue to the dashboard.',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      passwordHint: (min) => `At least ${min} characters`,
      submit: 'Reset password',
      submitting: 'Resetting password...',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      toastUpdatedTitle: 'Password updated',
      toastUpdatedBody: 'You can continue to your dashboard.',
      toastFailTitle: 'Reset failed',
      toastFailBody: 'Unable to reset password.',
      toastInvalidTitle: 'Invalid link',
      toastInvalidBody: 'Missing reset token in URL.',
      toastShortTitle: 'Password too short',
      toastShortBody: (min) => `Use at least ${min} characters.`,
      toastMismatchTitle: 'Password mismatch',
      toastMismatchBody: 'Please make sure both password fields are identical.',
      missingTokenBody: 'This reset link is missing a token. Generate a new one to continue.',
      newLinkCta: 'Generate a new reset link',
    },
  },
  pl: {
    login: {
      backHome: 'Wróć na stronę główną',
      title: 'Witaj ponownie',
      subtitle: 'Zaloguj się, aby kontynuować',
      email: 'E-mail',
      password: 'Hasło',
      rememberMe: 'Zapamiętaj mnie',
      forgotPassword: 'Nie pamiętasz hasła?',
      submit: 'Zaloguj',
      submitting: 'Logowanie…',
      showPassword: 'Pokaż hasło',
      hidePassword: 'Ukryj hasło',
      noAccount: 'Nie masz konta?',
      signUp: 'Załóż konto',
      toastWelcomeTitle: 'Witaj ponownie!',
      toastWelcomeBody: 'Jesteś zalogowany w evoFlowAI.',
      toastLoginFailTitle: 'Logowanie nieudane',
      toastLoginFailBody: 'Sprawdź e-mail i hasło.',
    },
    register: {
      backHome: 'Wróć na stronę główną',
      title: 'Załóż konto',
      subtitle: 'Zacznij lepszą drogę z żywieniem',
      namePlaceholder: 'Jan Kowalski',
      fullName: 'Imię i nazwisko',
      email: 'E-mail',
      password: 'Hasło',
      confirmPassword: 'Potwierdź hasło',
      passwordHint: 'Co najmniej 6 znaków',
      submit: 'Utwórz konto',
      submitting: 'Tworzenie konta…',
      showPassword: 'Pokaż hasło',
      hidePassword: 'Ukryj hasło',
      hasAccount: 'Masz już konto?',
      logIn: 'Zaloguj się',
      toastCreatedTitle: 'Konto utworzone',
      toastCreatedBody: 'Witaj w evoFlowAI. Zbudujmy Twój rytm.',
      toastRegisterFailTitle: 'Rejestracja nieudana',
      toastRegisterFailBody: 'Nie udało się utworzyć konta.',
      toastMismatchTitle: 'Hasła się nie zgadzają',
      toastMismatchBody: 'Upewnij się, że oba pola hasła są identyczne.',
      toastShortPasswordTitle: 'Hasło za krótkie',
      toastShortPasswordBody: 'Użyj co najmniej 6 znaków.',
    },
    forgot: {
      backLogin: 'Wróć do logowania',
      title: 'Reset hasła',
      subtitle: 'Podaj e-mail konta — wygenerujemy lokalny link resetujący.',
      email: 'E-mail',
      submit: 'Wygeneruj link',
      submitting: 'Generowanie…',
      toastResetTitle: 'Link gotowy',
      toastFailTitle: 'Nie udało się rozpocząć resetu',
      toastFailBody: 'Nie można zainicjować resetu hasła.',
      requestReceived: 'Prośba zapisana',
      requestBody: 'Jeśli istnieje konto dla {email}, możesz kontynuować linkiem poniżej.',
      resetLinkLabel: 'Lokalny link resetu',
      copyLink: 'Kopiuj link',
      openLink: 'Otwórz link',
      linkUnavailable: 'Lokalny link jest niedostępny. Sprawdź tryb resetu w backendzie.',
      remembered: 'Przypomniałeś hasło?',
      logIn: 'Zaloguj się',
      toastCopiedTitle: 'Skopiowano',
      toastCopiedBody: 'Link resetu skopiowany do schowka.',
      toastCopyFailTitle: 'Kopiowanie nieudane',
      toastCopyFailBody: 'Nie można skopiować linku.',
    },
    reset: {
      backLogin: 'Wróć do logowania',
      title: 'Nowe hasło',
      subtitle: 'Ustaw nowe hasło i przejdź do pulpitu.',
      newPassword: 'Nowe hasło',
      confirmPassword: 'Potwierdź nowe hasło',
      passwordHint: (min) => `Co najmniej ${min} znaków`,
      submit: 'Zapisz hasło',
      submitting: 'Zapisywanie…',
      showPassword: 'Pokaż hasło',
      hidePassword: 'Ukryj hasło',
      toastUpdatedTitle: 'Hasło zaktualizowane',
      toastUpdatedBody: 'Możesz przejść do pulpitu.',
      toastFailTitle: 'Reset nieudany',
      toastFailBody: 'Nie można zresetować hasła.',
      toastInvalidTitle: 'Nieprawidłowy link',
      toastInvalidBody: 'Brak tokenu w adresie URL.',
      toastShortTitle: 'Hasło za krótkie',
      toastShortBody: (min) => `Użyj co najmniej ${min} znaków.`,
      toastMismatchTitle: 'Hasła się nie zgadzają',
      toastMismatchBody: 'Upewnij się, że oba pola hasła są identyczne.',
      missingTokenBody: 'W linku brakuje tokenu. Wygeneruj nowy link resetu.',
      newLinkCta: 'Wygeneruj nowy link',
    },
  },
};
