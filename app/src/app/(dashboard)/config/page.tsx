"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const ageOptions = [13, 16, 18, 21, 25];

export default function ConfigPage() {
  const [config, setConfig] = useState({
    minimumAge: 18,
    strictMode: false,
    requireParentalConsent: true,
    allowedMethods: ["email", "credit_card", "id_upload"],
    redirectUrl: "",
    sessionDuration: 24,
    branding: {
      logo: "",
      primaryColor: "#3b82f6",
      companyName: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Failed to save configuration");
      toast.success("Configuration saved successfully");
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground">
          Manage your age verification settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Age Requirements</CardTitle>
            <CardDescription>
              Set the minimum age and verification requirements for your users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minimumAge">Minimum Age</Label>
              <Select
                value={config.minimumAge.toString()}
                onValueChange={(value) =>
                  setConfig({ ...config, minimumAge: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum age" />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map((age) => (
                    <SelectItem key={age} value={age.toString()}>
                      {age} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="strictMode">Strict Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Require additional verification steps for high-risk scenarios.
                </p>
              </div>
              <Switch
                id="strictMode"
                checked={config.strictMode}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, strictMode: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="parentalConsent">Parental Consent</Label>
                <p className="text-sm text-muted-foreground">
                  Require parental consent for users under 18.
                </p>
              </div>
              <Switch
                id="parentalConsent"
                checked={config.requireParentalConsent}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, requireParentalConsent: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Settings</CardTitle>
            <CardDescription>
              Configure how long verification sessions remain valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionDuration">Session Duration (hours)</Label>
              <Input
                id="sessionDuration"
                type="number"
                value={config.sessionDuration}
                onChange={(e) =>
                  setConfig({ ...config, sessionDuration: parseInt(e.target.value) || 24 })
                }
                min={1}
                max={720}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">Redirect URL</Label>
              <Input
                id="redirectUrl"
                placeholder="https://your-site.com/verified"
                value={config.redirectUrl}
                onChange={(e) =>
                  setConfig({ ...config, redirectUrl: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize the appearance of your age verification modal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={config.branding.companyName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    branding: { ...config.branding, companyName: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.branding.primaryColor}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, primaryColor: e.target.value },
                    })
                  }
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={config.branding.primaryColor}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: { ...config.branding, primaryColor: e.target.value },
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
