/**
 * Same pattern as LoginForm, for registration — includes role selection
 * (Student/Instructor) and a confirmation-required success message.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { registerSchema } from "../schemas/authSchema";
import { useRegister } from "../hooks/useRegister";
import { Input } from "../../../components/ui/Input/Input";
import { Button } from "../../../components/ui/Button/Button";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
];

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" },
  });

  const {
    mutate: registerUser,
    isPending,
    error,
    isSuccess,
    data,
  } = useRegister();

  const selectedRole = watch("role");
  const confirmationRequired = isSuccess && !data?.data?.session;

  function onSubmit(values) {
    registerUser(values);
  }

  if (confirmationRequired) {
    return (
      <div
        role="status"
        className="rounded-card border border-mist/50 bg-frost px-6 py-8 text-center"
      >
        <h2 className="text-subheading font-semibold text-carbon">
          Check your email
        </h2>
        <p className="mt-2 text-body-sm text-ash">
          We sent you a confirmation link. Please verify your email to activate
          your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        id="name"
        label="Name"
        {...register("name")}
        error={errors.name?.message}
      />
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
      <Input
        id="confirmPassword"
        label="Confirm password"
        type="password"
        {...register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <fieldset>
        <legend className="mb-2 text-body-sm font-medium text-smoke">
          I want to join as
        </legend>
        <div className="flex gap-3">
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setValue("role", role.value)}
                className={clsx(
                  "flex-1 rounded-card border px-4 py-2.5 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-blue",
                  isSelected
                    ? "border-link-blue bg-link-blue/5 text-link-blue"
                    : "border-mist text-smoke hover:bg-frost"
                )}
              >
                <input
                  type="radio"
                  value={role.value}
                  className="sr-only"
                  checked={isSelected}
                  readOnly
                  tabIndex={-1}
                />
                {role.label}
              </button>
            );
          })}
        </div>
        {errors.role && (
          <p className="mt-1 text-body-sm text-red-600">{errors.role.message}</p>
        )}
      </fieldset>

      {error && (
        <div
          role="alert"
          className="rounded-card border border-red-300 bg-red-50 px-4 py-3 text-body-sm text-red-700"
        >
          {error.message}
        </div>
      )}

      <Button type="submit" isLoading={isPending} fullWidth disabled={isPending}>
        Create account
      </Button>
    </form>
  );
}
