import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

import { getDatabase } from "./server/db";
import { apiRouter } from "./server/routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception in server:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

async function startServer() {
  const app = express();
  
  // Extract port from arguments or env variable or fallback to 3000
  const portArgIndex = process.argv.indexOf("--port");
  const portFromArg = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : null;
  const PORT = portFromArg || (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  app.use(express.json());

  // Initialize and seed database if necessary
  try {
    await getDatabase();
    console.log("[GTRA Database] Store and RBAC system initialized.");
  } catch (dbErr) {
    console.error("[GTRA Database Error] Failed to initialize database:", dbErr);
  }

  // Mount RBAC and Auth API Router
  app.use("/api", apiRouter);

  // Stripe initialization (Lazy)
  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripe;
  };

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Secure Donation Checkout
  app.post("/api/donations/create-checkout-session", async (req, res) => {
    const { amount, type, userId } = req.body;
    
    const client = getStripe();
    if (!client) {
      // For demo purposes, we mock success if no key is found
      const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      return res.json({ 
        url: `${baseUrl}?donation_success=true&amount=${amount}&type=${encodeURIComponent(type || "tithe")}`,
        mock: true 
      });
    }

    try {
      const session = await client.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `God The Rock Assembly - ${type}`,
              },
              unit_amount: Math.round(Number(amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL || `http://localhost:${PORT}`}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || `http://localhost:${PORT}`}?canceled=true`,
        metadata: {
          userId,
          donationType: type,
        },
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${PORT} in use, waiting for cleanup...`);
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer();
