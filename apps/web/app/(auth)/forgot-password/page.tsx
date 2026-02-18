'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    setIsSending(true);
    try {
      await resetPassword(data.email);
      toast.success('Se ha enviado un correo para restablecer tu contraseña');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar correo');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center">Recuperar contraseña</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="btn-primary btn-lg w-full"
        >
          {isSending ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href="/" className="text-primary-600 hover:text-primary-500">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
