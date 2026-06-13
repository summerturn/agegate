"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

interface Subscription {
  id: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  plan: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  verificationsPerMonth: number;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    verificationsPerMonth: 1000,
    features: ["Basic age verification", "Email support", "Standard analytics"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    verificationsPerMonth: 10000,
    highlighted: true,
    features: [
      "Advanced age verification",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    verificationsPerMonth: 100000,
    features: [
      "All Pro features",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
  },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription");
      if (!response.ok) throw new Error("Failed to fetch subscription");
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) throw new Error("Stripe failed to load");

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");
      const { sessionId } = await response.json();

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      toast.error("Failed to start checkout");
      console.error(error);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to cancel subscription");
      toast.success("Subscription will cancel at end of period");
      fetchSubscription();
    } catch (error) {
      toast.error("Failed to cancel subscription");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "past_due":
        return <Badge className="bg-red-100 text-red-800">Past Due</Badge>;
      case "canceled":
        return <Badge className="bg-gray-100 text-gray-800">Canceled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active plan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Plan: {subscription.plan}</p>
                <p className="text-sm text-muted-foreground">
                  Period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
            {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
              <Button variant="destructive" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            )}
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-yellow-600">
                Your subscription will cancel at the end of the current period.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.highlighted ? "border-primary ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">${plan.price}</span>/month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {plan.verificationsPerMonth.toLocaleString()} verifications/month
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscription?.plan === plan.id}
              >
                {subscription?.plan === plan.id ? "Current Plan" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
