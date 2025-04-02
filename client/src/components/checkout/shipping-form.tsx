import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define form schema
const shippingFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(5, "Please enter a valid shipping address"),
  billingAddress: z.string().optional(),
  sameAsShipping: z.boolean().default(true),
  shippingMethod: z.enum(["standard", "express", "pickup"]).default("standard"),
  orderNotes: z.string().optional(),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface ShippingFormProps {
  onSubmit: (data: ShippingFormValues) => void;
  defaultValues?: Partial<ShippingFormValues>;
}

export function ShippingForm({ onSubmit, defaultValues }: ShippingFormProps) {
  const { t } = useTranslation();
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Initialize form
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      billingAddress: "",
      sameAsShipping: true,
      shippingMethod: "standard",
      orderNotes: "",
      ...defaultValues
    },
  });

  // Handle form submission
  const handleSubmit = (values: ShippingFormValues) => {
    onSubmit(values);
  };

  return (
    <ScrollArea className="flex-1 pr-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shop.customerName")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("shop.customerNamePlaceholder") || "Full Name"} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shop.customerEmail")}</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder={t("shop.customerEmailPlaceholder") || "email@example.com"} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shop.customerPhone")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("shop.customerPhonePlaceholder") || "Phone Number (optional)"} 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shop.shippingAddress")}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={t("shop.shippingAddressPlaceholder") || "Enter your shipping address"} 
                    className="resize-none min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sameAsShipping"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setSameAsShipping(checked as boolean);
                      
                      // If checked, copy shipping address to billing
                      if (checked) {
                        form.setValue("billingAddress", form.getValues("shippingAddress"));
                      } else {
                        form.setValue("billingAddress", "");
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <Label htmlFor="sameAsShipping">
                    {t("shop.sameAsShipping")}
                  </Label>
                </div>
              </FormItem>
            )}
          />

          {!sameAsShipping && (
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shop.billingAddress")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("shop.billingAddressPlaceholder") || "Enter your billing address"} 
                      className="resize-none min-h-[80px]"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="shippingMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shop.shippingMethod")}</FormLabel>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="shipping-standard" 
                      value="standard"
                      checked={field.value === "standard"}
                      onChange={() => field.onChange("standard")}
                      className="rounded-full"
                    />
                    <Label htmlFor="shipping-standard" className="cursor-pointer">
                      {t("shop.shippingStandard")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="shipping-express" 
                      value="express"
                      checked={field.value === "express"}
                      onChange={() => field.onChange("express")}
                      className="rounded-full"
                    />
                    <Label htmlFor="shipping-express" className="cursor-pointer">
                      {t("shop.shippingExpress")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="shipping-pickup" 
                      value="pickup"
                      checked={field.value === "pickup"}
                      onChange={() => field.onChange("pickup")}
                      className="rounded-full"
                    />
                    <Label htmlFor="shipping-pickup" className="cursor-pointer">
                      {t("shop.shippingPickup")}
                    </Label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shop.orderNotes")}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={t("shop.orderNotesPlaceholder") || "Any special instructions? (optional)"} 
                    className="resize-none min-h-[60px]"
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <button type="submit" className="hidden" />
        </form>
      </Form>
    </ScrollArea>
  );
}