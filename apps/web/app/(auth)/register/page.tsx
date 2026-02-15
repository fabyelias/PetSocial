'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Mínimo 2 caracteres')
      .max(50, 'Máximo 50 caracteres')
      .optional()
      .or(z.literal('')),
    email: z.string().email('Email inválido').min(1, 'Email requerido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los términos',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// Password requirements check
const passwordRequirements = [
  { regex: /.{8,}/, label: 'Al menos 8 caracteres' },
  { regex: /[A-Z]/, label: 'Una letra mayúscula' },
  { regex: /[a-z]/, label: 'Una letra minúscula' },
  { regex: /[0-9]/, label: 'Un número' },
];

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(
        data.email,
        data.password,
        data.displayName || undefined
      );
      toast.success('¡Cuenta creada exitosamente!');
      router.push('/feed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la cuenta';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header mobile */}
      <div className="lg:hidden text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-xl">🐾</span>
          </div>
          <span className="text-xl font-bold">PetSocial</span>
        </Link>
      </div>

      {/* Form header */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Crear cuenta
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Únete a la comunidad de mascotas más grande
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Display Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Nombre (opcional)
          </label>
          <input
            {...register('displayName')}
            type="text"
            id="displayName"
            autoComplete="name"
            placeholder="Tu nombre"
            className={`input ${errors.displayName ? 'input-error' : ''}`}
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-500">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className={`input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password requirements */}
          {password && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, i) => {
                const isValid = req.regex.test(password);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs ${
                      isValid ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${isValid ? 'opacity-100' : 'opacity-30'}`}
                    />
                    {req.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <input
            {...register('acceptTerms')}
            type="checkbox"
            id="acceptTerms"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label
            htmlFor="acceptTerms"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            Acepto los{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">
              Términos de Servicio
            </Link>{' '}
            y la{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline">
              Política de Privacidad
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary btn-lg w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-gray-600 dark:text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
