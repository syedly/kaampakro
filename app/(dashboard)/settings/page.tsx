"use client"

import { useState } from "react"
import {
  Bell,
  CreditCard,
  Key,
  Moon,
  Sun,
  Globe,
  Shield,
  Trash2,
  Check,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    credits: 5,
    features: ["5 letters/month", "Basic AI models", "Email support"]
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/month",
    credits: 50,
    features: ["50 letters/month", "All AI models", "Priority support", "Custom prompts"],
    popular: true
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "$29",
    period: "/month",
    credits: -1,
    features: ["Unlimited letters", "All AI models", "24/7 support", "Custom prompts", "API access"]
  }
]

export default function SettingsPage() {
  const [currentPlan, setCurrentPlan] = useState("free")
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
    updates: true,
  })
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("en")

  // API Key state
  const [apiKey, setApiKey] = useState("")
  const [savingKey, setSavingKey] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveApiKey = async () => {
    if (apiKey && !apiKey.startsWith("sk-")) {
      toast.error("API key must start with 'sk-'")
      return
    }
    setSavingKey(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })
      if (res.ok) {
        toast.success(apiKey ? "API key saved — unlimited generations enabled!" : "API key removed")
        setApiKey("")
      } else {
        const d = await res.json()
        toast.error(d.error ?? "Failed to save API key")
      }
    } finally {
      setSavingKey(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    setSavingPassword(true)
    try {
      // For now show a success message — password change requires current password verification
      // which can be added to the profile PATCH endpoint
      toast.info("Password change coming soon — contact support to reset your password.")
    } finally {
      setSavingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account preferences and subscription
        </p>
      </div>

      {/* Subscription Plans */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5" />
            Subscription Plan
          </CardTitle>
          <CardDescription>Choose the plan that works best for you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border p-5 transition-all cursor-pointer",
                  currentPlan === plan.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50",
                  plan.popular && "border-primary/50"
                )}
                onClick={() => setCurrentPlan(plan.id)}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </span>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.credits === -1 ? "Unlimited" : plan.credits} credits/month
                  </p>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === plan.id ? (
                  <Button disabled className="mt-4 w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    variant={plan.popular ? "default" : "outline"} 
                    className={cn(
                      "mt-4 w-full",
                      plan.popular && "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    )}
                  >
                    {plan.price === "$0" ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about your account activity
                </p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, email: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive tips and special offers
                </p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, marketing: checked})
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new features
                </p>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) => 
                  setNotifications({...notifications, updates: checked})
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-2",
                    theme === "light" && "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  )}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-2",
                    theme === "dark" && "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  )}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-background">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Current Password</Label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">New Password</Label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full gap-2"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* OpenAI API Key */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Key className="h-5 w-5" />
              Your OpenAI API Key
            </CardTitle>
            <CardDescription>
              Add your own key to unlock unlimited cover letter generations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Why add your own key?</p>
              <p className="mt-1">Free plan: 5 letters/month. With your own OpenAI key: unlimited generations at no extra cost.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">OpenAI API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-background font-mono"
              />
              <p className="text-xs text-muted-foreground">Must start with &quot;sk-&quot;. Your key is encrypted and stored securely.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveApiKey}
                disabled={savingKey}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {savingKey ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save API Key
              </Button>
              <Button
                variant="outline"
                onClick={() => { setApiKey(""); handleSaveApiKey() }}
                disabled={savingKey}
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
