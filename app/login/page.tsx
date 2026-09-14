import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

// useSearchParams needs a Suspense boundary; the form itself is the client half.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
