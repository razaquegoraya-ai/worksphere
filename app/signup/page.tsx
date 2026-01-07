import { SignupForm } from "@/components/auth/signup-form"

export const metadata = {
  title: "Create Account - WorkSphere",
  description: "Create a new WorkSphere account",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">WorkSphere</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
