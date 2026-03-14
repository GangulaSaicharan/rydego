import { GoogleSignInButton } from "@/components/auth/google-auth-button"
import { Shield } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Welcome Back to Rydego
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in to access your dashboard
          </p>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-xl shadow-foreground/5 backdrop-blur-sm">
          <div className="space-y-6">
            <GoogleSignInButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Secure Authentication
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground px-8">
              By continuing, you agree to our{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">
                Privacy Policy
              </a>.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Prism Auth</span>
        </p>
      </div>
    </div>
  )
}
