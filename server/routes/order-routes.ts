import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireReadOrder, requireReadAllOrders, requireCreateOrder, requireUpdateOrder, requireDeleteOrder } from "../auth";

const router = Router();

// Get all orders (protected - requires READ_ALL_ORDERS permission)
router.get("/orders", requireReadAllOrders, async (req, res) => {
  try {
    const orders = await storage.getOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get recent orders (protected - requires READ_ALL_ORDERS permission)
router.get("/orders/recent", requireReadAllOrders, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const orders = await storage.getRecentOrders(limit);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ error: "Failed to fetch recent orders" });
  }
});

// Get orders by customer email (protected - requires READ_ALL_ORDERS permission or be the customer)
router.get("/orders/customer/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    // If user is not admin/manager and trying to access someone else's orders
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Check if user has permission to read all orders
    const hasAllOrdersPermission = req.user.role === "Admin" || req.user.role === "Manager";
    
    // If user doesn't have permission and is not the customer
    if (!hasAllOrdersPermission && req.user.username !== email) {
      return res.status(403).json({ error: "You don't have permission to access these orders" });
    }
    
    const orders = await storage.getOrdersByCustomerEmail(email);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ error: "Failed to fetch customer orders" });
  }
});

// Get order by ID (protected - requires READ_ORDER permission or be the customer)
router.get("/orders/:id", requireReadOrder, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const order = await storage.getOrderWithItems(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Check if user has permission to read all orders or if they own this order
    const hasAllOrdersPermission = req.user.role === "Admin" || req.user.role === "Manager";
    const isOwner = order.customerEmail === req.user.username;
    
    if (!hasAllOrdersPermission && !isOwner) {
      return res.status(403).json({ error: "You don't have permission to view this order" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Create new order (protected - requires CREATE_ORDER permission)
router.post("/orders", requireCreateOrder, async (req, res) => {
  try {
    // Basic validation schema
    const schema = z.object({
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
      shippingAddress: z.string(),
      billingAddress: z.string().optional(),
      paymentMethod: z.string(),
      status: z.string(),
      subtotal: z.number(),
      tax: z.number(),
      shipping: z.number(),
      total: z.number(),
      notes: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        productName: z.string(),
        unitPrice: z.number(),
        quantity: z.number(),
        subtotal: z.number(),
        notes: z.string().optional()
      }))
    });
    
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid order data", 
        details: validationResult.error.errors 
      });
    }
    
    const { items, ...orderData } = validationResult.data;
    
    // Create the order
    const order = await storage.createOrder(orderData, items);
    
    // Update product stock
    for (const item of items) {
      await storage.updateProductStock(item.productId, item.quantity, false);
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Update order status (protected - requires UPDATE_ORDER permission)
router.patch("/orders/:id", requireUpdateOrder, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    // Basic validation schema for update
    const schema = z.object({
      status: z.string().optional(),
      notes: z.string().optional(),
      trackingNumber: z.string().optional(),
      shipDate: z.string().optional(), // Will be converted to Date
    });
    
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid update data", 
        details: validationResult.error.errors 
      });
    }
    
    // Transform any date strings to Date objects
    const updateData = {...validationResult.data};
    if (updateData.shipDate) {
      updateData.shipDate = new Date(updateData.shipDate);
    }
    
    const updatedOrder = await storage.updateOrder(id, updateData);
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Delete order (protected - requires DELETE_ORDER permission)
router.delete("/orders/:id", requireDeleteOrder, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const success = await storage.deleteOrder(id);
    if (!success) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;