
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useTranslation } from "react-i18next";

interface AuthFormProps {
  mode: "signin" | "signup";
  onSubmit: (formData: any) => void;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      password,
      confirmPassword,
      firstName,
      lastName
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-white">{t('auth.firstName')}</Label>
            <Input
              id="firstName"
              placeholder={t('booking.enterFirstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-white">{t('auth.lastName')}</Label>
            <Input
              id="lastName"
              placeholder={t('booking.enterLastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="email" className="text-white">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('booking.enterEmail')}
          required
          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-white">{t('auth.password')}</Label>
          {mode === "signin" && (
            <button
              type="button"
              className="text-sm text-blue-400 hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          )}
        </div>
        <Input
          id="password"
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
        />
      </div>

      {mode === "signup" && (
        <div>
          <Label htmlFor="confirmPassword" className="text-white">{t('auth.confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
      )}

      <Button type="submit" className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900">
        {mode === "signin" ? t('auth.signInBtn') : t('auth.createAccountBtn')}
      </Button>
    </form>
  );
}
