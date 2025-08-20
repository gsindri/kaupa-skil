
import React from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from '@/contexts/useAuth';
import { Navigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <AuthCard title="Welcome back" description="Log in to continue.">
      <AuthForm mode="login" />
    </AuthCard>
  );
}
