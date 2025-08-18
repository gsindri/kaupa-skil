
import React from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthForm from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <AuthCard title="Create your account" description="Get started with Heilda.">
      <AuthForm mode="signup" />
    </AuthCard>
  );
}
