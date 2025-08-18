
import React from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" description="Sign in to continue.">
      <AuthForm mode="login" />
    </AuthCard>
  );
}
