import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Sign In - WorkSphere",
  description: "Sign in to your WorkSphere account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">WorkSphere</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
