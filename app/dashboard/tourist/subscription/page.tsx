import DashboardLayout from "@/components/layout/DashboardLayout";
import { Check, X } from "lucide-react";
import { RocketIcon } from "@radix-ui/react-icons";

export default function TouristSubscriptionPage() {
  return (
    <DashboardLayout role="tourist">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Subscription</h1>
          <p className="text-dark-500">Tourist Premium - coming soon!</p>
        </div>
        <div className="card p-8 text-center">
          <RocketIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold text-dark-900 mb-2">Tourist Premium Plans</h2>
          <p className="text-dark-500 mb-6">Premium tourist features are coming soon. Stay tuned for Wanderer and Explorer+ plans!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { name: "Free", price: "$0", features: ["Max 3 active bookings", "Standard search"] },
              { name: "Wanderer", price: "$4.99/mo", features: ["Unlimited bookings", "Early access to new guides"] },
              { name: "Explorer+", price: "$9.99/mo", features: ["Priority booking", "Trip insurance badge", "Exclusive guides"] },
            ].map((plan) => (
              <div key={plan.name} className="p-4 bg-dark-50 rounded-xl border border-dark-200">
                <h3 className="font-display font-bold text-dark-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary mt-1">{plan.price}</p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-dark-600">
                      <Check className="w-3.5 h-3.5 text-secondary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
