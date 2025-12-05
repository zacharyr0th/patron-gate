"use client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

interface TierCardProps {
  tier: {
    id: string;
    name: string;
    priceMonthly: string;
    priceYearly: string;
    benefits: string[];
    maxMembers: number;
    currentMembers: number;
    active: boolean;
  };
  onPurchase?: (tierId: number) => void;
  showPurchase?: boolean;
}

export function TierCard({ tier, onPurchase, showPurchase = true }: TierCardProps) {
  const monthlyPrice = (Number(tier.priceMonthly) / 100000000).toFixed(2);
  const yearlyPrice = (Number(tier.priceYearly) / 100000000).toFixed(2);
  const isFull = tier.currentMembers >= tier.maxMembers;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tier.name}</CardTitle>
          {!tier.active && <Badge variant="secondary">Inactive</Badge>}
          {isFull && <Badge variant="destructive">Full</Badge>}
        </div>
        <CardDescription>
          {tier.currentMembers} / {tier.maxMembers} members
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          <div className="text-3xl font-bold">${monthlyPrice}</div>
          <div className="text-sm text-muted-foreground">per month</div>
          <div className="text-sm text-muted-foreground mt-1">
            ${yearlyPrice} per year (save $
            {(Number(monthlyPrice) * 12 - Number(yearlyPrice)).toFixed(2)})
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Benefits:</div>
          <ul className="space-y-1">
            {tier.benefits.map((benefit, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      {showPurchase && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => onPurchase?.(Number.parseInt(tier.id.split("-tier-")[1]))}
            disabled={!tier.active || isFull}
          >
            {isFull ? "Tier Full" : "Subscribe"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
