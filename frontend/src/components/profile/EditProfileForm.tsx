"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, UserCircle2 } from "lucide-react";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/auth.schema";
import { useAuthStore } from "@/store/auth.store";
import { extractApiError } from "@/lib/api/client";

export default function EditProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    setServerError(null);
    setSuccess(false);
    try {
      const updated = await updateProfile({ name: values.name });
      reset({ name: updated.name });
      setSuccess(true);
    } catch (err) {
      setServerError(extractApiError(err, "Could not update profile"));
    }
  };

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <UserCircle2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Edit profile</h2>
          <p className="text-xs text-muted">Username, email and phone are locked.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Profile updated.
          </div>
        )}

        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:border-brand focus:outline-none"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Username" value={`@${user.username}`} />
          <ReadOnlyField label="Email" value={user.email} />
          <ReadOnlyField label="Phone" value={user.phone} />
          <ReadOnlyField
            label="Role"
            value={user.role === "admin" ? "Administrator" : "Traveller"}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark transition disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </form>
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate rounded-lg bg-soft px-3 py-2 text-sm text-ink">
        {value}
      </p>
    </div>
  );
}
