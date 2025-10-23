
import React from "react";
import { useAuth } from '@/contexts/useAuth';
import { Navigate } from "react-router-dom";
import AuthCard from "@/components/auth/AuthCard";
import AuthForm from "@/components/auth/AuthForm";

export default function SignupPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthCard title="Create your account" description="Get started with Heilda.">
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
