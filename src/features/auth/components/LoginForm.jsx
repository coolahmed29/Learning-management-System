/**
 * Presentational + form-logic component for the login form. No routing/redirect
 * logic — handles form state, validation, and calling useLogin's mutate.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/authSchema";
import { useLogin } from "../hooks/useLogin";
import { Input } from "../../../components/ui/Input/Input";
import { Button } from "../../../components/ui/Button/Button";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending, error: loginError } = useLogin();

  function onSubmit(values) {
    login(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="email"
        label="Email"
        type="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        {...register("password")}
        error={errors.password?.message}
      />

      {loginError && (
        <div
          role="alert"
          className="rounded-card border border-red-300 bg-red-50 px-4 py-3 text-body-sm text-red-700"
        >
          {loginError.message}
        </div>
      )}

      <Button type="submit" isLoading={isPending} fullWidth disabled={isPending}>
        Log In
      </Button>
    </form>
  );
}
